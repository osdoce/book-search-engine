import { GraphQLError } from 'graphql';
import  User  from '../models/User.js'; // Adjust the import path
import { signToken } from '../utils/auth.js'; // Adjust the import path
import { ensureAuthenticated } from '../utils/auth.js'; // Adjust the import path

export const resolvers = {
  Query: {
    me: async (_: any, __: any, context: { req: any }) => {
      const user = ensureAuthenticated(context);
      if(user){
        return User.findOne({ _id: user._id });
      }
      return null;
    },
  },
  Mutation: {
    login: async (_: any, { email, password }: any) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new GraphQLError('No user found with this email address', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new GraphQLError('Incorrect credentials', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    addUser: async (_: any, { username, email, password }: any) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user.username, user.email, user._id);
      return { token, user };
    },
    saveBook: async (_: any, { bookInput }: any, context: { req: any }) => {
      const user = ensureAuthenticated(context);
      if(user){
        try{
          const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            { $addToSet: { savedBooks: bookInput } },
            { new: true, runValidators: true }
          );
          return updatedUser;
        } catch(err){
          throw new GraphQLError('Could not save book', {
            extensions: { code: 'INTERNAL_SERVER_ERROR' },
          });
        }
      }
      return null;
    },
    removeBook: async (_: any, { bookId }: any, context: { req: any }) => {
      const user = ensureAuthenticated(context);
      if(user){
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );
        return updatedUser;
      }
      return null;
    },
  },
};