import { Keyboard, Platform } from 'react-native';
import PropTypes from 'prop-types';
import React from 'react';

const INITIAL_ANIMATION_DURATION = 250;
/**
 * @export
 * @class KeyboardState
 * @extends {React.Component}
 * @state contentHeight: The height available for our messaging content.
 * @state keyboardHeight: The height of the keyboard. We keep track of this so we set our image picker
to the same size as the keyboard.
 * @state keyboardVisible: Is the keyboard fully visible or fully hidden?
 * @state keyboardWillShow: Is the keyboard animating into view currently? This is only relevant on
iOS.
 * @state keyboardWillHide: Is the keyboard animating out of view currently? This is only relevant on
iOS, and we’ll only use it for fixing visual issues on the iPhone X.
 * @state keyboardAnimationDuration: When we animate our UI to avoid the keyboard, we’ll want to
use the same animation duration as the keyboard. Let’s initialize this with the value 250 (in milliseconds) as an approximation.
 */
export default class KeyboardState extends React.Component {
	static propTypes = {
		layout: PropTypes.shape({
			x: PropTypes.number.isRequired,
			y: PropTypes.number.isRequired,
			width: PropTypes.number.isRequired,
			height: PropTypes.number.isRequired,
		}).isRequired,
		children: PropTypes.func.isRequired,
	};

	constructor(props) {
		super(props);
		const {
			layout: { height },
		} = props;

		this.state = {
			contentHeight: height,
			keyboardHeight: 0,
			keyboardVisible: false,
			keyboardWillShow: false,
			keyboardWillHide: false,
			keyboardAnimationDuration: INITIAL_ANIMATION_DURATION,
		};
	}
	// There are 4 Keyboard events we should listen for:
	// 	• keyboardWillShow (iOS only) - The keyboard is going to appear
	// 	• keyboardWillHide (iOS only) - The keyboard is going to disappear
	//  • keyboardDidShow - The keyboard is now fully visible
	// 	• keyboardDidHide - The keyboard is now fully hidden
	componentWillMount() {
		// add listeners to each keyboard event
		if (Platform.OS === 'ios') {
			// Storing subscription handles in an array is a common practice in React Native.
			// We don’t know exactly how many subscriptions we’ll have until runtime,
			// since it’s different on each platform, so removing all subscriptions from an array
			// is easier than storing and removing a reference to each listener callback.
			this.subscriptions = [
				Keyboard.addListener('keyboardWillShow', this.keyboardWillShow),
				Keyboard.addListener('keyboardWillHide', this.keyboardWillHide),
				Keyboard.addListener('keyboardDidShow', this.keyboardDidShow),
				Keyboard.addListener('keyboardDidHide', this.keyboardDidHide),
			];
		} else {
			// We’ll add the listeners slightly differently for each platform: on Android,
			// we don’t get events for keyboardWillHide or keyboardWillShow.
			this.subscriptions = [
				Keyboard.addListener('keyboardDidHide', this.keyboardDidHide),
				Keyboard.addListener('keyboardDidShow', this.keyboardDidShow),
			];
		}
	}

	componentWillUnmount() {
		// remove all event listeners
		this.subscriptions.forEach(subscription => subscription.remove());
	}

	measure = event => {
		const { layout } = this.props;
		const {
			endCoordinates: { height, screenY },
			duration = INITIAL_ANIMATION_DURATION,
		} = event;

		this.setState({
			// To calculate the contentHeight, we can take the screenY (top coordinate of the keyboard) and subtract layout.y (top coordinate of our messaging component).
			// y coordinates lower down on the screen are larger than those higher on the screen, so this calculation will resulting in a positive value.
			contentHeight: screenY - layout.y,
			keyboardHeight: height,
			keyboardAnimationDuration: duration,
		});
	};

	// The listeners keyboardWillShow, keyboardDidShow, and keyboardWillHide will each be called with an event object,
	// which we can use to measure the contentHeight and keyboardHeight.
	keyboardWillShow = event => {
		this.setState({ keyboardWillShow: true });
		this.measure(event);
	};
	// For iOS it would be sufficient to calculate measurements in the keyboardWill* events,
	// since the keyboardDid* events should receive the same event parameter.
	// However, since Android only supports the keyboardDid* events, we also need to use keyboardDidShow.
	keyboardDidShow = event => {
		this.setState({
			keyboardWillShow: false,
			keyboardVisible: true,
		});
		this.measure(event);
	};

	keyboardWillHide = event => {
		this.setState({ keyboardWillHide: true });
		this.measure(event);
	};

	keyboardDidHide = () => {
		this.setState({
			keyboardWillHide: false,
			keyboardVisible: false,
		});
	};

	render() {
		const { children, layout } = this.props;
		const {
			contentHeight,
			keyboardHeight,
			keyboardVisible,
			keyboardWillShow,
			keyboardWillHide,
			keyboardAnimationDuration,
		} = this.state;

		return children({
			containerHeight: layout.height,
			contentHeight,
			keyboardHeight,
			keyboardVisible,
			keyboardWillShow,
			keyboardWillHide,
			keyboardAnimationDuration,
		});
	}
}

// Each event object will have the following properties:
// • duration - Duration of the keyboard animation.
// In practice, this is typically constant across all keyboard animations.
// This property only exists on iOS, so we’ll use a constant to approximate it on Android.
// • easing - Easing curve used by the keyboard animation.
// This will be the special easing curve called 'keyboard',
// which we can use to sync our own animations with the keyboard’s.
// This property only exists on iOS, since there isn’t a specific keyboard animation on Android
// . We’ll use 'easeInEaseOut' as a pleasant-looking default to approximate the keyboard animation on Android.
// • startCoordinates, endCoordinates - An object containing keys height, width, screenX, and screenY.
// These refer to the start and end coordinates of the keyboard. Normally height, width,
// and screenX will stay the same. We can use height to determine the height of the keyboard.
// The screenY value refers to the top of the keyboard, which we can use to determine the remaining height available to render content.
