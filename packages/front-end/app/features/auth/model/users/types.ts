export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  website: string;
};

export type UserFilter = {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
};

export type CreateUserDto = {
  name: string;
  email: string;
  phone: string;
  website: string;
};
