import { IUser } from './../../interfaces/user.interface';
import { findElements, findOneElement } from '../../lib/db-operation';
import { COLLECTIONS, EXPIRETIME, MESSAGES } from './../../config/constants';
import { IResolvers } from 'graphql-tools';
import JWT from './../../lib/jwt';
import bcrypt from 'bcrypt';

const resolversUserQuery: IResolvers = {
  Query: {
    async users(_, __, { db }) {
      try {
        return {
          status: true,
          message: 'Lista de usuarios cargada correctamente',
          users: await findElements(db, COLLECTIONS.USERS),
        };
      } catch (error) {
        console.log(error);
        return {
          status: false,
          message:
            'Error al cargar los usuarios. Comprueba qaue tienes correctamente todo.',
          users: [],
        };
      }
    },
    async login(_, { email, password }, { db }) {
      try {
        const user: IUser = (await findOneElement(db, COLLECTIONS.USERS, {
          email,
        })) as IUser;
        if (user == null) {
          return {
            status: false,
            message: 'Usuario no existe',
            token: null,
          };
        }

        const passwordCheck = bcrypt.compareSync(password, user.password || '');

        if (passwordCheck != null) {
          user.password = '';
          user.birthday = '';
          user.registerDate = '';
        }
        return {
          status: true,
          message: !passwordCheck
            ? 'Password y usuario no correctos, sesión no iniciada'
            : 'Usuario cargado correctamente',
          token: !passwordCheck
            ? null
            : new JWT().sign({ user }, EXPIRETIME.H24),
          user,
        };
      } catch (error) {
        console.log(error);
        return {
          status: false,
          message:
            'Error al cargar el usuario. Comprueba que tienes correctamente todo.',
          token: null,
        };
      }
    },
    me(_, __, { token }) {
      let info = new JWT().verify(token);
      if (info === MESSAGES.TOKEN_VERICATION_FAILED) {
        return {
          status: false,
          message: info,
          user: null,
        };
      }
      return {
        status: true,
        message: 'Usuario autenticado correctamente mediante el token',
        user: Object.values(info)[0],
      };
    },
  },
};

export default resolversUserQuery;
