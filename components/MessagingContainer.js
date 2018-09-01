import React from 'react';
import PropTypes from 'prop-types';
// LayoutAnimation is the only way we can match the exact animation of the keyboard.
// It’s used internally by the built-in KeyboardAvoidingView component, so it’s safe for us to use despite being considered experimental.
import { BackHandler, LayoutAnimation, Platform, UIManager, View } from 'react-native';
import { isIphoneX } from 'react-native-iphone-x-helper';
// Currently LayoutAnimation is disabled by default on Android, so we need to enable it
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const INPUT_METHOD = {
	NONE: 'NONE',
	KEYBOARD: 'KEYBOARD',
	CUSTOM: 'CUSTOM',
};

export default class MessagingContainer extends React.Component {
	static propTypes = {
		// From `KeyboardState`
		containerHeight: PropTypes.number.isRequired,
		contentHeight: PropTypes.number.isRequired,
		keyboardHeight: PropTypes.number.isRequired,
		keyboardVisible: PropTypes.bool.isRequired,
		keyboardWillShow: PropTypes.bool.isRequired,
		keyboardWillHide: PropTypes.bool.isRequired,
		keyboardAnimationDuration: PropTypes.number.isRequired,
		// Managing the IME type
		inputMethod: PropTypes.oneOf(Object.values(INPUT_METHOD)).isRequired,
		onChangeInputMethod: PropTypes.func,
		// Rendering content (render props pattern?)
		children: PropTypes.node,
		renderInputMethodEditor: PropTypes.func.isRequired,
	};

	static defaultProps = {
		children: null,
		onChangeInputMethod: () => {},
	};

	componentDidMount() {
		// handle the hardware back button on Android.
		this.subscription = BackHandler.addEventListener('hardwareBackPress', () => {
			const { onChangeInputMethod, inputMethod } = this.props;

			if (inputMethod === INPUT_METHOD.CUSTOM) {
				// When the CUSTOM IME is active,
				// we want the back button to dismiss the IME, just like it would for the device keyboard.
				onChangeInputMethod(INPUT_METHOD.NONE);
				return true;
			}
			return false;
		});
	}

	componentWillUnmount() {
		this.subscription.remove();
	}

	componentWillReceiveProps(nextProps) {
		const { onChangeInputMethod } = this.props;
		if (!this.props.keyboardVisible && nextProps.keyboardVisible) {
			// Keyboard shown
			onChangeInputMethod(INPUT_METHOD.KEYBOARD);
		} else if (
			// Keyboard hidden
			this.props.keyboardVisible &&
			!nextProps.keyboardVisible &&
			this.props.inputMethod !== INPUT_METHOD.CUSTOM
		) {
			onChangeInputMethod(INPUT_METHOD.NONE);
		}

		const { keyboardAnimationDuration } = nextProps;
		const animation = LayoutAnimation.create(
			keyboardAnimationDuration,
			Platform.OS === 'android'
				? LayoutAnimation.Types.easeInEaseOut
				: LayoutAnimation.Types.keyboard,
			LayoutAnimation.Properties.opacity
		);
		// LayoutAnimation applies to the entire component hierarchy, not just the component we call it from,
		// so this will actually animate every component in our app.
		LayoutAnimation.configureNext(animation);
	}

	render() {
		const {
			children,
			renderInputMethodEditor,
			inputMethod,
			containerHeight,
			contentHeight,
			keyboardHeight,
			keyboardWillShow,
			keyboardWillHide,
		} = this.props;

		// For our outer `View`, we want to choose between rendering at full
		// height (`containerHeight`) or only the height above the keyboard
		// (`contentHeight`). If the keyboard is currently appearing
		// (`keyboardWillShow` is `true`) or if it's fully visible
		// (`inputMethod === INPUT_METHOD.KEYBOARD`), we should use // `contentHeight`.
		const useContentHeight = keyboardWillShow || inputMethod === INPUT_METHOD.KEYBOARD;
		const containerStyle = {
			height: useContentHeight ? contentHeight : containerHeight,
		};
		// We want to render our custom input when the user has pressed the camera
		// button (`inputMethod === INPUT_METHOD.CUSTOM`), so long as the keyboard
		// isn't currently appearing (which would mean the input field has received
		// focus, but we haven't updated the `inputMethod` yet).
		const showCustomInput = inputMethod === INPUT_METHOD.CUSTOM && !keyboardWillShow;

		// The keyboard is hidden and not transitioning up
		const keyboardIsHidden = inputMethod === INPUT_METHOD.NONE && !keyboardWillShow;
		// The keyboard is visible and transitioning down
		const keyboardIsHiding = inputMethod === INPUT_METHOD.KEYBOARD && keyboardWillHide;

		// If `keyboardHeight` is `0`, this means a hardware keyboard is connected
		// to the device. We still want to show our custom image picker when a
		// hardware keyboard is connected, so let's set `keyboardHeight` to `250`
		// in this case.
		const inputStyle = {
			height: showCustomInput ? keyboardHeight || 250 : 0,
			// Show extra space if the device is an iPhone X the keyboard is not visible
			marginTop: isIphoneX() && (keyboardIsHidden || keyboardIsHiding) ? 24 : 0,
		};

		return (
			<View style={containerStyle}>
				{children}
				<View style={inputStyle}>{renderInputMethodEditor()}</View>
			</View>
		);
	}
}
