export function checkUserId(req, res, next) {
  const userId = req.auth?.userId;
  const { body } = req;

  if (!userId) {
    throw new Error("user_id_missing");
  }

  // If there is a body let's add the userId to make all subsequent requests easier
  if (body && !Object.hasOwn(body, "userId")) {
    body.userId = userId;
  }

  next();
}

export function checkBody(req, res, next) {
  const { body } = req;

  if (!body || Object.keys(body).length === 0) {
    throw new Error("body_missing");
  }

  // if body is present but no user id is provided we need to exit
  if (!Object.hasOwn(body, "userId")) {
    throw new Error("body_user_id_missing");
  }

  next();
}

export function checkParamForId(req, res, next) {
  const { id } = req.params;

  if (!id) {
    throw new Error("param_id_missing");
  }

  next();
}
