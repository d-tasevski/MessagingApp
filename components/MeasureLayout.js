import React from 'react';
import PropTypes from 'prop-types';
import { Constants } from 'expo';
import { Platform, StyleSheet, View } from 'react-native';

export default class MeasureLayout extends React.Component {
	static propTypes = {
		children: PropTypes.func.isRequired,
	};

	state = {
		layout: null,
	};

	handleLayout = event => {
		const {
			nativeEvent: { layout },
		} = event;
		// get a precise height which we can use to resize our UI when the keyboard appears and disappears
		this.setState({
			layout: {
				...layout,
				y: layout.y + (Platform.OS === 'android' ? Constants.statusBarHeight : 0),
			},
		});
	};

	render() {
		const { children } = this.props;
		const { layout } = this.state;
		// Measure the available space with a placeholder view set to flex 1
		if (!layout) {
			return <View onLayout={this.handleLayout} style={styles.container} />;
		}

		return children(layout);
	}
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
