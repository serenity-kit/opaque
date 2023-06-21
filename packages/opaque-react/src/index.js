import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

/**
 * @typedef {Object} Config
 * @prop {string} basePath
 * @prop {typeof import('@serenity-kit/opaque')} opaque
 * @prop {typeof fetch} [fetch]
 * @prop {HeadersInit} [headers]
 */

/**
 * @param {Config} config
 */
export function useOpaqueRegister(config) {
  const ref = useRef(config);
  useLayoutEffect(() => {
    ref.current = config;
  }, [config]);

  const register = useCallback(
    async (
      /** @type {string} */ userIdentifier,
      /** @type {string} */ password
    ) => {
      const { fetch = window.fetch, opaque, basePath } = ref.current;
      const { clientRegistration, registrationRequest } =
        opaque.clientRegistrationStart(password);
      const { registrationResponse } = await fetch(
        `${basePath}/register/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...ref.current.headers,
          },
          body: JSON.stringify({
            userIdentifier,
            registrationRequest,
          }),
        }
      ).then((res) => res.json());

      const { registrationUpload } = opaque.clientRegistrationFinish({
        clientRegistration,
        registrationResponse,
        password,
      });

      const res = await fetch(`${basePath}/register/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ref.current.headers,
        },
        body: JSON.stringify({
          userIdentifier,
          registrationUpload,
        }),
      });

      return res.ok;
    },
    []
  );

  return register;
}

/**
 * @param {Config} config
 */
export function useOpaqueLogin(config) {
  const ref = useRef(config);
  useLayoutEffect(() => {
    ref.current = config;
  }, [config]);

  const login = useCallback(
    async (
      /** @type {string} */ userIdentifier,
      /** @type {string} */ password
    ) => {
      const { fetch = window.fetch, opaque, basePath } = ref.current;

      const { clientLogin, credentialRequest } =
        opaque.clientLoginStart(password);

      const { credentialResponse } = await fetch(`${basePath}/login/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ref.current.headers,
        },
        body: JSON.stringify({
          userIdentifier,
          credentialRequest,
        }),
      }).then((res) => res.json());

      const loginResult = opaque.clientLoginFinish({
        clientLogin,
        credentialResponse,
        password,
      });

      if (!loginResult) {
        return null;
      }
      const { sessionKey, credentialFinalization } = loginResult;

      const res = await fetch(`${basePath}/login/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ref.current.headers,
        },
        body: JSON.stringify({
          userIdentifier,
          credentialFinalization,
        }),
      });
      return res.ok ? sessionKey : null;
    },
    []
  );

  return login;
}

/**
 * @param {Config} config
 */
export function useOpaqueRegisterRequest(config) {
  const register = useOpaqueRegister(config);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(/** @returns {unknown|null} */ () => null);
  const request = useCallback(
    async (
      /** @type {string} */ userIdentifier,
      /** @type {string} */ password
    ) => {
      try {
        setLoading(true);
        const success = await register(userIdentifier, password);
        setLoading(false);
      } catch (err) {
        setError(err);
      }
    },
    [register]
  );
  return { request, isLoading, error };
}

/**
 * @param {Config} config
 */
export function useOpaqueLoginRequest(config) {
  const doLogin = useOpaqueLogin(config);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(/** @returns {unknown|null} */ () => null);
  const [sessionKey, setSessionKey] = useState(
    /** @returns {string|null} **/ () => null
  );
  const login = useCallback(
    async (
      /** @type {string} */ userIdentifier,
      /** @type {string} */ password
    ) => {
      try {
        setLoading(true);
        const sessionKey = await doLogin(userIdentifier, password);
        setLoading(false);
        setSessionKey(sessionKey);
      } catch (err) {
        setError(err);
      }
    },
    [doLogin]
  );
  return { login, isLoading, error, sessionKey };
}
