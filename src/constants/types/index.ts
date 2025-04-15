import i18n from 'i18n-js';
import {ImageSourcePropType} from 'react-native';
import {CalendarBaseProps} from 'react-native-calendars';
import {ITheme} from './theme';

export * from './components';
export * from './theme';

export interface IUser {
  id: string;
  username: string;
  avatar: number;
  badges: [];
  points: number;
  survey: { [key: number]: string[] };
  currLessons: { [key:string]: number};
  currCourses: string[];
  completedCourses: string[];
}

export interface IBadge {
  id: string; // used to specify image
}
export interface IUseData {
  isDark: boolean;
  handleIsDark: (isDark?: boolean) => void;
  theme: ITheme;
  setTheme: (theme?: ITheme) => void;
  user: IUser;
  setUser: (user?: IUser) => void;
  users: IUser[];
  handleUser: (data?: IUser) => void;
  handleUsers: (data?: IUser[]) => void;
  completedCourses: string[];
  setCompletedCourses: (data?: string[]) => void;
  currentCourses: string[];
  setCurrentCourses: (data?: string[]) => void;
  currentLessons: Record<string, number>;
  setCurrentLessons: (data?: Record<string, number>) => void;
}

export interface ITranslate {
  locale: string;
  setLocale: (locale?: string) => void;
  t: (scope?: i18n.Scope, options?: i18n.TranslateOptions) => string;
  translate: (scope?: i18n.Scope, options?: i18n.TranslateOptions) => string;
}