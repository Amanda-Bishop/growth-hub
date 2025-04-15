import React, { useState, useCallback } from 'react';
import {
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image as RNImage,
  Platform,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useTheme } from '../hooks/';
import Block from './Block';
import Text from './Text';

interface SearchbarProps {
  id?: string;
  style?: any;
  color?: string;
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  black?: boolean;
  white?: boolean;
  gray?: boolean;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
  info?: boolean;
  search?: boolean;
  disabled?: boolean;
  label?: string;
  icon?: string;
  marginBottom?: number;
  marginTop?: number;
  marginHorizontal?: number;
  marginVertical?: number;
  marginRight?: number;
  marginLeft?: number;
  onFocus?: (event: any) => void;
  onBlur?: (event: any) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  onSubmitEditing?: (event: any) => void;
  [key: string]: any;
}

const Searchbar: React.FC<SearchbarProps> = ({
  id = 'Searchbar',
  style,
  color,
  primary,
  secondary,
  tertiary,
  black,
  white,
  gray,
  danger,
  warning,
  success,
  info,
  search = true, 
  disabled,
  label,
  icon,
  marginBottom,
  marginTop,
  marginHorizontal,
  marginVertical,
  marginRight,
  marginLeft,
  onFocus,
  onBlur,
  onSearch,
  placeholder = "Search courses...",
  onSubmitEditing,
  ...props
}) => {
  const { assets, colors, sizes } = useTheme();
  const [query, setQuery] = useState('');
  const [isFocused, setFocused] = useState(false);

  const handleFocus = useCallback(
    (event, focus) => {
      setFocused(focus);
      focus && onFocus?.(event);
      !focus && onBlur?.(event);
    },
    [setFocused, onFocus, onBlur],
  );

  const handleInputChange = (text: string) => {
    setQuery(text);
    // For immediate search-as-you-type functionality
    onSearch?.(text);
  };

  const handleSearch = () => {
    onSearch?.(query);
  };

  const handleSubmitEditing = (event: any) => {
    onSubmitEditing?.(event);
    handleSearch();
  };

  const colorIndex = primary
    ? 'primary'
    : secondary
    ? 'secondary'
    : tertiary
    ? 'tertiary'
    : black
    ? 'black'
    : white
    ? 'white'
    : gray
    ? 'gray'
    : danger
    ? 'danger'
    : warning
    ? 'warning'
    : success
    ? 'success'
    : info
    ? 'info'
    : null;
  const inputColor = color
    ? color
    : colorIndex
    ? colors?.[colorIndex]
    : colors.gray;

  const inputBoxStyles = StyleSheet.flatten([
    style,
    {
      minHeight: sizes.inputHeight,
      ...(marginBottom && {marginBottom: marginBottom}),
      ...(marginTop && {marginTop: marginTop}),
      ...(marginHorizontal && {marginHorizontal: marginHorizontal}),
      ...(marginVertical && {marginVertical: marginVertical}),
      ...(marginRight && {marginRight: marginRight}),
      ...(marginLeft && {marginLeft: marginLeft}),
    },
  ]) as ViewStyle;

  const inputContainerStyles = StyleSheet.flatten([
    {
      minHeight: sizes.inputHeight,
      borderRadius: sizes.inputRadius,
      borderWidth: isFocused ? 2 : sizes.inputBorder,
      borderColor: isFocused ? colors.focus : inputColor,
    },
  ]) as ViewStyle;

  const inputStyles = StyleSheet.flatten([
    {
      flex: 1,
      zIndex: 2,
      height: '100%',
      fontSize: sizes.p,
      color: colors.input,
      paddingHorizontal: sizes.inputPadding,
    },
  ]) as TextStyle;

  // generate component testID or accessibilityLabel based on Platform.OS
  const inputID =
    Platform.OS === 'android' ? {accessibilityLabel: id} : {testID: id};

  return (
    <Block flex={0} style={inputBoxStyles}>
      {label && (
        <Text bold marginBottom={sizes.s}>
          {label}
        </Text>
      )}
      <Block row align="center" justify="flex-end" style={inputContainerStyles}>
        {search && assets.search && (
          <RNImage
            source={assets.search}
            style={{marginLeft: sizes.inputPadding, tintColor: colors.icon}}
          />
        )}
        {icon && (
          <RNImage
            source={assets?.[icon]}
            style={{marginLeft: sizes.inputPadding, tintColor: colors.icon}}
          />
        )}
        <TextInput
          {...inputID}
          {...props}
          style={inputStyles}
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={inputColor}
          value={query}
          onChangeText={handleInputChange}
          onSubmitEditing={handleSubmitEditing}
          returnKeyType="search"
          onFocus={(event) => handleFocus(event, true)}
          onBlur={(event) => handleFocus(event, false)}
        />
        {danger && assets.warning && (
          <RNImage
            source={assets.warning}
            style={{
              marginRight: sizes.s,
              tintColor: colors.danger,
            }}
          />
        )}
        {success && assets.check && (
          <RNImage
            source={assets.check}
            style={{
              width: 12,
              height: 9,
              marginRight: sizes.s,
              tintColor: colors.success,
            }}
          />
        )}
        {query.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setQuery('');
              onSearch?.('');
            }}
            style={{padding: sizes.s}}
          >
            <Block justify="center" align="center">
              <RNImage
                source={assets?.close || assets?.x}
                style={{
                  width: 16,
                  height: 16,
                  marginRight: sizes.s,
                  tintColor: colors.icon,
                }}
              />
            </Block>
          </TouchableOpacity>
        )}
      </Block>
    </Block>
  );
};

export default React.memo(Searchbar);