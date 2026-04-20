import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";
import "./LoginScreen.css";

export function LoginScreen() {
  const { instance } = useMsal();

  return (
    <div className="loginPage">
      <div className="loginCard">
        <h1>Painel interno</h1>
        <p className="loginLead">Acesso restrito. Entre com a conta Microsoft da organização.</p>
        <button type="button" className="loginMicrosoftBtn" onClick={() => void instance.loginRedirect(loginRequest)}>
          Entrar com Microsoft
        </button>
        <p className="loginHint">
          O administrador deve cadastrar esta URL de redirecionamento no aplicativo do Entra ID (Azure AD).
        </p>
      </div>
    </div>
  );
}
