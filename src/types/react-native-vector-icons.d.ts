declare module 'react-native-vector-icons/FontAwesome6' {
  import { Component } from 'react';
  import { TextStyle } from 'react-native';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
  }

  export default class Icon extends Component<IconProps> {
    static loadFont(): Promise<void>;
  }
}
