export interface RegisterRequestDto {
  email: string;
  username: string;
  password: string;
  rol: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface JwtLoginResponseDto {
  token: string;
  username: string;
  email: string;
  rol?: string;
}

export interface PerfilUsuarioDto {
  username: string;
  fotoUrl: string;
  rol?: string;
}

