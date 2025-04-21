export interface UserGet {
  id: number;
  username: string;
  urlFoto: string;
  slug: string;
  followersCount: number;
}

export interface UserDescription {
  id: number;
  username: string;
  description: string;
  rol: string;
  urlimage: string;
  slug: string;
  createdAt: string;
  followersCount: number;
  followedsCount: number;
  artistasSeguidos: UserGet[];
}


export interface GetAll {
  usuarios: UserGet[];
}
