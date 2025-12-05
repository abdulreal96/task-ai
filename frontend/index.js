import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import 'fast-text-encoding';
import { registerGlobals } from '@livekit/react-native';

registerGlobals();

import registerRootComponent from 'expo/build/launch/registerRootComponent';
import App from './App';

registerRootComponent(App);
