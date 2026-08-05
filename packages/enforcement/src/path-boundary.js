import { randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import {
  lstat,
  open,
  realpath,
  rename,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';
import {
  assertGateAmendmentDecision,
  verifySliceLock,
} from './lock.js';

export class ScopeDeniedError extends Error {
  constructor({ requestedPath, allowedPaths, amendmentPath, reason }) {
    super(`scope denied: ${requestedPath}`);
    this.name = 'ScopeDeniedError';
    this.code = 'SCOPA_SCOPE_DENIED';
    this.details = {
      schema: 'scopa.scope-denial.v1',
      boundary: 'scope',
      requestedPath,
      allowedPaths: [...allowedPaths],
      amendmentPath,
      reason,
    };
  }
}

async function resolveThroughExistingAncestor(target) {
  let cursor = target;
  const suffix = [];
  while (true) {
    try {
      await lstat(cursor);
      return path.resolve(await realpath(cursor), ...suffix);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const parent = path.dirname(cursor);
      if (parent === cursor) throw error;
      suffix.unshift(path.basename(cursor));
      cursor = parent;
    }
  }
}

export function matchesPathRule(relative, rule) {
  if (rule.endsWith('/**')) {
    const prefix = rule.slice(0, -3);
    return relative === prefix || relative.startsWith(`${prefix}/`);
  }
  return relative === rule;
}

function fileIdentity(metadata) {
  return `${metadata.dev}:${metadata.ino}`;
}

async function mutationParentBinding(target) {
  let parentPath = path.dirname(target);
  while (true) {
    try {
      const metadata = await lstat(parentPath);
      if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
        throw new Error('mutation parent must be a real directory');
      }
      return {
        parentPath,
        parentIdentity: fileIdentity(metadata),
      };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const next = path.dirname(parentPath);
      if (next === parentPath) throw error;
      parentPath = next;
    }
  }
}

async function descriptorDirectoryPath(handle, expectedIdentity) {
  for (const root of ['/proc/self/fd', '/dev/fd']) {
    const descriptorPath = path.join(root, String(handle.fd));
    try {
      const resolved = await realpath(descriptorPath);
      const metadata = await lstat(resolved);
      if (
        metadata.isDirectory() &&
        fileIdentity(metadata) === expectedIdentity
      ) {
        return descriptorPath;
      }
    } catch {
      // Try the next platform descriptor filesystem.
    }
  }
  return null;
}

export class PathBoundary {
  constructor({
    repoRoot,
    lock,
    lockPath = 'scopa.slice-lock.json',
    rotationPath = '.scopa/rotation.json',
    decisionVerifier = null,
  }) {
    if (typeof repoRoot !== 'string' || !path.isAbsolute(repoRoot)) {
      throw new TypeError('repoRoot must be absolute');
    }
    this.repoRoot = path.resolve(repoRoot);
    this.lock = verifySliceLock(lock);
    this.lockPath = lockPath;
    this.rotationPath = rotationPath;
    this.decisionVerifier = decisionVerifier;
  }

  async authorize(targetPath, { decision } = {}) {
    if (typeof targetPath !== 'string' || targetPath.length === 0) {
      throw new TypeError('targetPath must be a non-empty string');
    }
    const root = await realpath(this.repoRoot);
    const lexical = path.resolve(root, targetPath);
    const resolved = await resolveThroughExistingAncestor(lexical);
    const relative = path.relative(root, resolved).split(path.sep).join('/');
    const outside =
      relative === '..' ||
      relative.startsWith('../') ||
      path.isAbsolute(relative);
    const definition = this.lock.definition;
    if (outside) {
      throw new ScopeDeniedError({
        requestedPath: targetPath,
        allowedPaths: definition.allowedPaths,
        amendmentPath: definition.amendmentPath,
        reason: 'target resolves outside repository',
      });
    }
    try {
      const metadata = await lstat(resolved);
      if (metadata.isFile() && metadata.nlink > 1) {
        throw new ScopeDeniedError({
          requestedPath: relative,
          allowedPaths: definition.allowedPaths,
          amendmentPath: definition.amendmentPath,
          reason: 'hard-linked mutation targets are not allowed',
        });
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (relative === this.lockPath) {
      try {
        assertGateAmendmentDecision(decision, this.lock.definitionHash);
        if (
          typeof this.decisionVerifier !== 'function' ||
          (await this.decisionVerifier(decision, this.lock.definitionHash)) !== true
        ) {
          throw new Error('decision is not present in the trusted principal channel');
        }
      } catch {
        throw new ScopeDeniedError({
          requestedPath: relative,
          allowedPaths: definition.allowedPaths,
          amendmentPath: definition.amendmentPath,
          reason: 'slice-lock mutation requires a bound principal DECISION',
        });
      }
      return {
        allowed: true,
        absolutePath: resolved,
        relativePath: relative,
        principalDecision: true,
        definitionHash: this.lock.definitionHash,
        ...await mutationParentBinding(resolved),
      };
    }
    if (relative === this.rotationPath) {
      throw new ScopeDeniedError({
        requestedPath: relative,
        allowedPaths: definition.allowedPaths,
        amendmentPath: definition.amendmentPath,
        reason: 'rotation state is kernel-owned continuity data',
      });
    }
    if (!definition.allowedPaths.some((rule) => matchesPathRule(relative, rule))) {
      throw new ScopeDeniedError({
        requestedPath: relative,
        allowedPaths: definition.allowedPaths,
        amendmentPath: definition.amendmentPath,
        reason: 'target is outside the active slice',
      });
    }
    return {
      allowed: true,
      absolutePath: resolved,
      relativePath: relative,
      principalDecision: false,
      definitionHash: this.lock.definitionHash,
      ...await mutationParentBinding(resolved),
    };
  }

  async revalidate(authorization, { decision } = {}) {
    if (
      !authorization ||
      authorization.definitionHash !== this.lock.definitionHash ||
      typeof authorization.relativePath !== 'string' ||
      typeof authorization.absolutePath !== 'string' ||
      typeof authorization.parentPath !== 'string' ||
      typeof authorization.parentIdentity !== 'string'
    ) {
      throw new ScopeDeniedError({
        requestedPath: authorization?.relativePath ?? '<invalid authorization>',
        allowedPaths: this.lock.definition.allowedPaths,
        amendmentPath: this.lock.definition.amendmentPath,
        reason: 'authorization is not bound to the active slice lock',
      });
    }
    const current = await this.authorize(authorization.relativePath, { decision });
    if (
      current.absolutePath !== authorization.absolutePath ||
      current.parentPath !== authorization.parentPath ||
      current.parentIdentity !== authorization.parentIdentity
    ) {
      throw new ScopeDeniedError({
        requestedPath: authorization.relativePath,
        allowedPaths: this.lock.definition.allowedPaths,
        amendmentPath: this.lock.definition.amendmentPath,
        reason: 'target topology changed after authorization',
      });
    }
    return current;
  }

  async writeFileAtomic(
    authorization,
    content,
    { decision, encoding = 'utf8' } = {},
  ) {
    if (typeof content !== 'string') {
      throw new TypeError('atomic write content must be a string');
    }
    const current = await this.revalidate(authorization, { decision });
    if (current.parentPath !== path.dirname(current.absolutePath)) {
      throw new ScopeDeniedError({
        requestedPath: current.relativePath,
        allowedPaths: this.lock.definition.allowedPaths,
        amendmentPath: this.lock.definition.amendmentPath,
        reason: 'mutation parent directory does not exist',
      });
    }
    let parentHandle = null;
    let temporaryHandle = null;
    let temporaryPath = null;
    try {
      parentHandle = await open(
        current.parentPath,
        fsConstants.O_RDONLY |
          fsConstants.O_DIRECTORY |
          fsConstants.O_NOFOLLOW,
      );
      const parentMetadata = await parentHandle.stat();
      if (
        !parentMetadata.isDirectory() ||
        fileIdentity(parentMetadata) !== current.parentIdentity
      ) {
        throw new ScopeDeniedError({
          requestedPath: current.relativePath,
          allowedPaths: this.lock.definition.allowedPaths,
          amendmentPath: this.lock.definition.amendmentPath,
          reason: 'mutation parent topology changed before execution',
        });
      }
      const descriptorPath = await descriptorDirectoryPath(
        parentHandle,
        current.parentIdentity,
      );
      if (descriptorPath === null) {
        throw new ScopeDeniedError({
          requestedPath: current.relativePath,
          allowedPaths: this.lock.definition.allowedPaths,
          amendmentPath: this.lock.definition.amendmentPath,
          reason: 'atomic mutation binding is unavailable',
        });
      }
      const targetPath = path.join(
        descriptorPath,
        path.basename(current.absolutePath),
      );
      let targetMode = 0o644;
      try {
        const targetMetadata = await lstat(targetPath);
        if (!targetMetadata.isFile() || targetMetadata.nlink !== 1) {
          throw new ScopeDeniedError({
            requestedPath: current.relativePath,
            allowedPaths: this.lock.definition.allowedPaths,
            amendmentPath: this.lock.definition.amendmentPath,
            reason: 'aliased or non-regular mutation targets are not allowed',
          });
        }
        targetMode = targetMetadata.mode & 0o777;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      temporaryPath = path.join(
        descriptorPath,
        `.scopa-write-${process.pid}-${randomUUID()}`,
      );
      temporaryHandle = await open(
        temporaryPath,
        fsConstants.O_WRONLY |
          fsConstants.O_CREAT |
          fsConstants.O_EXCL |
          fsConstants.O_NOFOLLOW,
        0o600,
      );
      await temporaryHandle.writeFile(content, { encoding });
      await temporaryHandle.sync();
      await temporaryHandle.chmod(targetMode);
      await temporaryHandle.close();
      temporaryHandle = null;
      await rename(temporaryPath, targetPath);
      temporaryPath = null;
      await parentHandle.sync();
      return current;
    } catch (error) {
      if (error instanceof ScopeDeniedError) throw error;
      throw new ScopeDeniedError({
        requestedPath: current.relativePath,
        allowedPaths: this.lock.definition.allowedPaths,
        amendmentPath: this.lock.definition.amendmentPath,
        reason: 'atomic mutation could not be committed',
      });
    } finally {
      await temporaryHandle?.close().catch(() => {});
      if (temporaryPath !== null) {
        await unlink(temporaryPath).catch(() => {});
      }
      await parentHandle?.close();
    }
  }
}
