export function createEnforcedToolDispatcher({ boundary, tools }) {
  if (!boundary || typeof boundary.authorize !== 'function') {
    throw new TypeError('boundary.authorize is required');
  }
  if (!tools || typeof tools !== 'object' || Array.isArray(tools)) {
    throw new TypeError('tools must be an object');
  }
  for (const [name, tool] of Object.entries(tools)) {
    if (
      !tool ||
      typeof tool.execute !== 'function' ||
      !['OBSERVE', 'MUTATE'].includes(tool.effect)
    ) {
      throw new TypeError(
        `tool ${name} must declare effect OBSERVE or MUTATE and execute`,
      );
    }
    if (
      tool.effect === 'MUTATE' &&
      (!Array.isArray(tool.pathArguments) || tool.pathArguments.length === 0)
    ) {
      throw new TypeError(`mutating tool ${name} must declare pathArguments`);
    }
  }
  let mutationTail = Promise.resolve();

  async function invoke(call) {
    const tool = tools[call?.name];
    if (!tool || typeof tool.execute !== 'function') {
      throw new Error(`unknown tool: ${call?.name}`);
    }
    const args = call.arguments ?? {};
    const authorizedArgs = { ...args };
    const authorizations = [];
    if (tool.effect === 'MUTATE') {
      const pathArguments = tool.pathArguments;
      for (const argument of pathArguments) {
        if (!Object.hasOwn(args, argument)) {
          throw new Error(`mutating tool ${call.name} is missing ${argument}`);
        }
        const authorization = await boundary.authorize(args[argument], {
          decision: call.decision,
        });
        authorizations.push(authorization);
        authorizedArgs[argument] = authorization.absolutePath;
      }
      if (typeof boundary.revalidate !== 'function') {
        throw new TypeError('boundary.revalidate is required for mutating tools');
      }
      for (const authorization of authorizations) {
        await boundary.revalidate(authorization, { decision: call.decision });
      }
    }
    return tool.execute(authorizedArgs);
  }

  return async function dispatch(call) {
    const tool = tools[call?.name];
    if (tool?.effect !== 'MUTATE') return invoke(call);

    const current = mutationTail.then(
      () => invoke(call),
      () => invoke(call),
    );
    mutationTail = current.catch(() => {});
    return current;
  };
}
