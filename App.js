import { Alert, StyleSheet, View } from 'react-native';
import React from 'react';

import MessageList from './components/MessageList';
import Status from './components/Status';
import { createImageMessage, createLocationMessage, createTextMessage } from './utils/MessageUtils';

export default class App extends React.Component {
	state = {
		messages: [
			createImageMessage('https://unsplash.it/300/300'),
			createTextMessage('World'),
			createTextMessage('Hello'),
			createLocationMessage({
				latitude: 37.78825,
				longitude: -122.4324,
			}),
		],
	};

	handlePressMessage = ({ id, type }) => {
		switch (type) {
			case 'text':
				Alert.alert(
					'Delete message?',
					'Are you sure you want to permanently delete this message?',
					[
						{
							text: 'Cancel',
							style: 'cancel',
						},
						{
							text: 'Delete',
							style: 'destructive',
							onPress: () => {
								const { messages } = this.state;
								this.setState({
									messages: messages.filter(message => message.id !== id),
								});
							},
						},
					]
				);
				break;
			default:
				break;
		}
	};

	renderMessageList() {
		const { messages } = this.state;
		return (
			<View style={styles.content}>
				<MessageList messages={messages} onPressMessage={this.handlePressMessage} />{' '}
			</View>
		);
	}
	renderInputMethodEditor() {
		return <View style={styles.inputMethodEditor} />;
	}
	renderToolbar() {
		return <View style={styles.toolbar} />;
	}
	render() {
		return (
			<View style={styles.container}>
				<Status />
				{this.renderMessageList()}
				{this.renderToolbar()}
				{this.renderInputMethodEditor()}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	content: {
		flex: 1,
		backgroundColor: 'white',
	},
	inputMethodEditor: {
		flex: 1,
		backgroundColor: 'white',
	},
	toolbar: {
		borderTopWidth: 1,
		borderTopColor: 'rgba(0,0,0,0.04)',
		backgroundColor: 'white',
	},
});
