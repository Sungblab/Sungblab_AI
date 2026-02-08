declare module "@react-oauth/google" {
  export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    authuser: string;
    prompt: string;
  }

  export interface GoogleLoginProps {
    onSuccess: (response: TokenResponse) => void;
    onError: () => void;
  }

  export function useGoogleLogin(props: GoogleLoginProps): () => void;

  export interface GoogleOAuthProviderProps {
    clientId: string;
    children: React.ReactNode;
  }

  export function GoogleOAuthProvider(
    props: GoogleOAuthProviderProps
  ): JSX.Element;
}
