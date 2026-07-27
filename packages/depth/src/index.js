export {
  DepthVerificationError,
  decodeCanonicalBase64,
  encodeBase64,
} from './schema.js';
export {
  KEY_CLASS_IDS,
  createKeyClass,
  verifyKeyClass,
} from './key-class.js';
export {
  createInferPin,
  replayInferOffline,
  verifyInferPin,
} from './infer-pin.js';
export {
  appendInferPinRecords,
  verifyInferPinLinkage,
} from './infer-link.js';
export {
  SIGNATURE_ALGORITHM,
  SIGNING_DOMAIN,
  createCommitmentSignature,
  generateSoftwareSigningKeyPair,
  verifyCommitmentSignature,
} from './signature.js';
export {
  createRfc3161Anchor,
  createRfc3161Request,
  requestRfc3161Timestamp,
  verifyRfc3161Anchor,
} from './rfc3161.js';
export {
  attachTimestampAnchor,
  createEvidencePacket,
  verifyEvidencePacket,
} from './packet.js';
