import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

const MAPPING: Record<string, MaterialIconName> = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'square.fill': 'crop-square',
  'list.clipboard.fill': 'assignment',
  'person.crop.circle.fill': 'account-circle',
  'person.fill': 'person',
  'creditcard.fill': 'credit-card',
  'checkmark.circle.fill': 'check-circle',
  search: 'search',
  minus: 'remove',
  plus: 'add',
  'trash.fill': 'delete',
  'clock.fill': 'schedule',
  'printer.fill': 'print',
  'antenna.radiowaves.left.and.right': 'bluetooth',
  'key.fill': 'vpn-key',
  'calendar.fill': 'calendar-today',
  'rectangle.portrait.and.arrow.forward': 'logout',
  'circle.fill': 'circle',
  circle: 'radio-button-unchecked',
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName =
    typeof name === 'string' ? (MAPPING[name] ?? 'help-outline') : 'help-outline';

  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
