import { lstat, realpath } from 'node:fs/promises';
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

function matchesRule(relative, rule) {
  if (rule.endsWith('/**')) {
    const prefix = rule.slice(0, -3);
    return relative === prefix || relative.startsWith(`${prefix}/`);
  }
  return relative === rule;
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
    if (!definition.allowedPaths.some((rule) => matchesRule(relative, rule))) {
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
    };
  }

  async revalidate(authorization, { decision } = {}) {
    if (
      !authorization ||
      authorization.definitionHash !== this.lock.definitionHash ||
      typeof authorization.relativePath !== 'string' ||
      typeof authorization.absolutePath !== 'string'
    ) {
      throw new ScopeDeniedError({
        requestedPath: authorization?.relativePath ?? '<invalid authorization>',
        allowedPaths: this.lock.definition.allowedPaths,
        amendmentPath: this.lock.definition.amendmentPath,
        reason: 'authorization is not bound to the active slice lock',
      });
    }
    const current = await this.authorize(authorization.relativePath, { decision });
    if (current.absolutePath !== authorization.absolutePath) {
      throw new ScopeDeniedError({
        requestedPath: authorization.relativePath,
        allowedPaths: this.lock.definition.allowedPaths,
        amendmentPath: this.lock.definition.amendmentPath,
        reason: 'target topology changed after authorization',
      });
    }
    return current;
  }
}
