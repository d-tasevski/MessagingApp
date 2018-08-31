import { CameraRoll, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Permissions } from 'expo';
import PropTypes from 'prop-types';
import React from 'react';
import Grid from './Grid';

const keyExtractor = ({ uri }) => uri;

export default class ImageGrid extends React.Component {
	static propTypes = {
		onPressImage: PropTypes.func,
	};

	static defaultProps = {
		onPressImage: () => {},
	};

	loading = false;
	cursor = null;

	state = {
		images: [],
	};

	componentDidMount() {
		this.getImages();
	}

	getImages = async after => {
		if (this.loading) return;
		// We set this.loading = true before making the asynchronous call to getPhotos,
		// and we wait till the asynchronous call to this.setState() has completed before setting this.loading = false.
		this.loading = true;
		const results = await CameraRoll.getPhotos({
			first: 20,
			after,
		});
		const {
			edges,
			page_info: { has_next_page, end_cursor },
		} = results;
		const loadedImages = edges.map(item => item.node.image);

		return this.setState(
			{
				images: this.state.images.concat(loadedImages),
			},
			() => {
				// By keeping track of loading, we can be certain that we’ll only ever load one set of images at a time.
				this.loading = false;
				this.cursor = has_next_page ? end_cursor : null;
			}
		);
	};

	getNextImages = () => {
		if (!this.cursor) return;
		return this.getImages(this.cursor);
	};

	renderItem = ({ item: { uri }, size, marginTop, marginLeft }) => {
		const { onPressImage } = this.props;
		const style = {
			width: size,
			height: size,
			marginLeft,
			marginTop,
		};

		return (
			<TouchableOpacity
				key={uri}
				activeOpacity={0.75}
				onPress={() => onPressImage(uri)}
				style={style}
			>
				<Image source={{ uri }} style={styles.image} />
			</TouchableOpacity>
		);
	};

	render() {
		const { images } = this.state;
		return (
			<Grid
				data={images}
				renderItem={this.renderItem}
				keyExtractor={keyExtractor}
				onEndReached={this.getNextImages}
			/>
		);
	}
}

const styles = StyleSheet.create({
	image: {
		flex: 1,
	},
});
