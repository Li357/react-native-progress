import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Animated, Easing, View } from 'react-native';

const INDETERMINATE_HEIGHT_FACTOR = 0.3;
const BAR_HEIGHT_ZERO_POSITION =
  INDETERMINATE_HEIGHT_FACTOR / (1 + INDETERMINATE_HEIGHT_FACTOR);

export default class ProgressBar extends Component {
  static propTypes = {
    animated: PropTypes.bool,
    borderColor: PropTypes.string,
    borderRadius: PropTypes.number,
    borderWidth: PropTypes.number,
    children: PropTypes.node,
    color: PropTypes.string,
    height: PropTypes.number,
    indeterminate: PropTypes.bool,
    onLayout: PropTypes.func,
    progress: PropTypes.number,
    style: PropTypes.any,
    unfilledColor: PropTypes.string,
    width: PropTypes.number,
    useNativeDriver: PropTypes.bool,
    // eslint-disable-next-line react/forbid-prop-types
    animationConfig: PropTypes.object.isRequired,
    animationType: PropTypes.oneOf(['decay', 'timing', 'spring']),
  };

  static defaultProps = {
    animated: true,
    borderRadius: 4,
    borderWidth: 1,
    color: 'rgba(0, 122, 255, 1)',
    height: 150,
    indeterminate: false,
    progress: 0,
    width: 6,
    useNativeDriver: false,
    animationConfig: { bounciness: 0 },
    animationType: 'spring',
  };

  constructor(props) {
    super(props);
    const progress = Math.min(Math.max(props.progress, 0), 1);
    this.state = {
      width: 0,
      progress: new Animated.Value(
        props.indeterminate ? INDETERMINATE_HEIGHT_FACTOR : progress
      ),
      animationValue: new Animated.Value(BAR_HEIGHT_ZERO_POSITION),
    };
  }

  componentDidMount() {
    if (this.props.indeterminate) {
      this.animate();
    }
  }

  componentWillReceiveProps(props) {
    if (props.indeterminate !== this.props.indeterminate) {
      if (props.indeterminate) {
        this.animate();
      } else {
        Animated.spring(this.state.animationValue, {
          toValue: BAR_HEIGHT_ZERO_POSITION,
          useNativeDriver: props.useNativeDriver,
        }).start();
      }
    }
    if (
      props.indeterminate !== this.props.indeterminate ||
      props.progress !== this.props.progress
    ) {
      const progress = props.indeterminate
        ? INDETERMINATE_HEIGHT_FACTOR
        : Math.min(Math.max(props.progress, 0), 1);

      if (props.animated) {
        const { animationType, animationConfig } = this.props;
        Animated[animationType](this.state.progress, {
          ...animationConfig,
          toValue: progress,
          useNativeDriver: props.useNativeDriver,
        }).start();
      } else {
        this.state.progress.setValue(progress);
      }
    }
  }

  animate() {
    this.state.animationValue.setValue(0);
    Animated.timing(this.state.animationValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      isInteraction: false,
      useNativeDriver: this.props.useNativeDriver,
    }).start(endState => {
      if (endState.finished) {
        this.animate();
      }
    });
  }

  handleLayout = event => {
    if (!this.props.height) {
      this.setState({ height: event.nativeEvent.layout.height });
    }
    if (this.props.onLayout) {
      this.props.onLayout(event);
    }
  };

  render() {
    const {
      borderColor,
      borderRadius,
      borderWidth,
      children,
      color,
      height,
      style,
      unfilledColor,
      width,
      ...restProps
    } = this.props;

    const innerHeight = Math.max(0, height || this.state.height) - borderWidth * 2;
    const containerStyle = {
      height,
      borderWidth,
      borderColor: borderColor || color,
      borderRadius,
      overflow: 'hidden',
      backgroundColor: unfilledColor,
    };
    const progressStyle = {
      backgroundColor: color,
      width,
      height: innerHeight,
      transform: [
        {
          translateY: this.state.animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [innerHeight * -INDETERMINATE_HEIGHT_FACTOR, innerHeight],
          }),
        },
        {
          translateY: this.state.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [innerHeight / -2, 0],
          }),
        },
        {
          // Interpolation a temp workaround for https://github.com/facebook/react-native/issues/6278
          scaleY: this.state.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.0001, 1],
          }),
        },
      ],
    };

    return (
      <View
        style={[containerStyle, style]}
        onLayout={this.handleLayout}
        {...restProps}
      >
        <Animated.View style={progressStyle} />
        {children}
      </View>
    );
  }
}
