import { spawnSync } from 'node:child_process';
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function run(args, cwd) {
  const result = spawnSync('openssl', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
  });
  if (result.status !== 0) {
    throw new Error(
      `OpenSSL fixture command failed: openssl ${args.join(' ')}\n` +
        `${result.stderr ?? ''}${result.stdout ?? ''}`,
    );
  }
}

const ROOT_CONFIG = `[req]
prompt = no
distinguished_name = dn
x509_extensions = v3_ca

[dn]
CN = SCOPA S4 Test Root
O = Heart AI Foundation Test Evidence

[v3_ca]
basicConstraints = critical, CA:true
keyUsage = critical, keyCertSign, cRLSign
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always
`;

const TSA_REQUEST_CONFIG = `[req]
prompt = no
distinguished_name = dn

[dn]
CN = SCOPA S4 Test Timestamp Authority
O = Heart AI Foundation Test Evidence
`;

const TSA_EXTENSION_CONFIG = `[tsa_ext]
basicConstraints = critical, CA:false
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, timeStamping
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
`;

const TSA_CONFIG = `[tsa]
default_tsa = tsa_config

[tsa_config]
serial = tsa-serial
signer_cert = tsa-cert.pem
certs = root-cert.pem
signer_key = tsa-key.pem
signer_digest = sha256
default_policy = 1.3.6.1.4.1.57264.1
digests = sha256
accuracy = secs:1
ordering = yes
tsa_name = yes
ess_cert_id_chain = yes
ess_cert_id_alg = sha256
`;

export async function createLocalTsaFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'scopa-tsa-fixture-'));
  await Promise.all([
    writeFile(path.join(root, 'root.cnf'), ROOT_CONFIG),
    writeFile(path.join(root, 'tsa-req.cnf'), TSA_REQUEST_CONFIG),
    writeFile(path.join(root, 'tsa-ext.cnf'), TSA_EXTENSION_CONFIG),
    writeFile(path.join(root, 'tsa.cnf'), TSA_CONFIG),
    writeFile(path.join(root, 'tsa-serial'), '01\n'),
  ]);
  run(
    [
      'req',
      '-new',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      'root-key.pem',
      '-out',
      'root-cert.pem',
      '-days',
      '2',
      '-sha256',
      '-config',
      'root.cnf',
    ],
    root,
  );
  run(
    [
      'req',
      '-new',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      'tsa-key.pem',
      '-out',
      'tsa.csr',
      '-sha256',
      '-config',
      'tsa-req.cnf',
    ],
    root,
  );
  run(
    [
      'x509',
      '-req',
      '-in',
      'tsa.csr',
      '-CA',
      'root-cert.pem',
      '-CAkey',
      'root-key.pem',
      '-CAcreateserial',
      '-out',
      'tsa-cert.pem',
      '-days',
      '2',
      '-sha256',
      '-extfile',
      'tsa-ext.cnf',
      '-extensions',
      'tsa_ext',
    ],
    root,
  );
  const [rootCertPem, tsaCertPem] = await Promise.all([
    readFile(path.join(root, 'root-cert.pem'), 'utf8'),
    readFile(path.join(root, 'tsa-cert.pem'), 'utf8'),
  ]);
  return {
    authorityId: 'scopa-s4-local-test-tsa',
    rootCertPem,
    tsaCertPem,
    async issue(queryBytes) {
      await writeFile(path.join(root, 'request.tsq'), queryBytes);
      run(
        [
          'ts',
          '-reply',
          '-config',
          'tsa.cnf',
          '-queryfile',
          'request.tsq',
          '-out',
          'response.tsr',
        ],
        root,
      );
      return new Uint8Array(await readFile(path.join(root, 'response.tsr')));
    },
    async close() {
      await rm(root, { recursive: true, force: true });
    },
  };
}
