import React, { useState, useCallback } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/';
import Block from './Block';
import Text from './Text';
import Image from './Image';

interface FilterPanelProps {
  onFilterChange: (filters: {
    minRating: number | null;
    maxDuration: number | null;
  }) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  onFilterChange,
  isExpanded = false,
  onToggleExpand = () => {},
}) => {
  const { colors, sizes, icons } = useTheme();
  
  // Filter states
  const [minRating, setMinRating] = useState<number | null>(null);
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
  
  // Rating options
  const ratingOptions = [null, 3, 3.5, 4, 4.5];
  
  // Duration options (in hours)
  const durationOptions = [null, 1, 2, 3, 5, 10];

  const handleRatingChange = useCallback((rating: number | null) => {
    setMinRating(rating);
    onFilterChange({ minRating: rating, maxDuration });
  }, [maxDuration, onFilterChange]);

  const handleDurationChange = useCallback((duration: number | null) => {
    setMaxDuration(duration);
    onFilterChange({ minRating, maxDuration: duration });
  }, [minRating, onFilterChange]);

  const resetFilters = useCallback(() => {
    setMinRating(null);
    setMaxDuration(null);
    onFilterChange({ minRating: null, maxDuration: null });
  }, [onFilterChange]);

  return (
    <Block card padding={sizes.s} marginBottom={sizes.m}>
      <TouchableOpacity onPress={onToggleExpand}>
        <Block row justify="space-between" align="center" marginBottom={isExpanded ? sizes.sm : 0}>
          <Block row align="center">
            <Image source={icons.filter || icons.settings} width={18} height={18} marginRight={sizes.s} />
            <Text p semibold>Filters</Text>
          </Block>
          <Image 
            source={icons.arrow}
            color={colors.primary} 
            width={16} 
            height={16}
            style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} 
          />
        </Block>
      </TouchableOpacity>

      {isExpanded && (
        <Block>
          {/* Rating filter */}
          <Block marginTop={sizes.sm}>
            <Text p semibold marginBottom={sizes.xs}>
              Minimum Rating
            </Text>
            <Block row>
              {ratingOptions.map((rating) => (
                <TouchableOpacity
                  key={`rating-${rating || 'any'}`}
                  onPress={() => handleRatingChange(rating)}
                >
                  <Block
                    card
                    padding={sizes.xs}
                    margin={sizes.xs / 2}
                    color={minRating === rating ? colors.primary : colors.card}
                  >
                    <Text
                      p
                      color={minRating === rating ? colors.white : colors.text}
                    >
                      {rating === null ? 'Any' : `${rating}+`}
                    </Text>
                  </Block>
                </TouchableOpacity>
              ))}
            </Block>
          </Block>

          {/* Duration filter */}
          <Block marginTop={sizes.sm}>
            <Text p semibold marginBottom={sizes.xs}>
              Maximum Duration
            </Text>
            <Block row wrap="wrap">
              {durationOptions.map((duration) => (
                <TouchableOpacity
                  key={`duration-${duration || 'any'}`}
                  onPress={() => handleDurationChange(duration)}
                >
                  <Block
                    card
                    padding={sizes.xs}
                    margin={sizes.xs / 2}
                    color={maxDuration === duration ? colors.primary : colors.card}
                  >
                    <Text
                      p
                      color={maxDuration === duration ? colors.white : colors.text}
                    >
                      {duration === null ? 'Any' : `≤ ${duration}h`}
                    </Text>
                  </Block>
                </TouchableOpacity>
              ))}
            </Block>
          </Block>

          {/* Reset button */}
          <TouchableOpacity onPress={resetFilters}>
            <Block align="center" marginTop={sizes.sm}>
              <Text primary semibold>
                Reset Filters
              </Text>
            </Block>
          </TouchableOpacity>
        </Block>
      )}
    </Block>
  );
};

export default FilterPanel;