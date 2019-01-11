import React from 'react';

import PropTypes from 'prop-types';
import classes from './PlaylistPanel.scss';
import { artworkForMediaItem, humanifyMillis } from '../../../utils/Utils';
import SongList from '../Songs/SongList/SongList';
import Loader from '../../common/Loader';
import * as MusicPlayerApi from '../../../services/MusicPlayerApi';
import * as MusicApi from '../../../services/MusicApi';

export default class PlaylistPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playlist: this.props.playlist,
      runtime: 0,
      items: [],
    };

    this.ref = React.createRef();
    this.store = {};

    this.playSong = this.playSong.bind(this);
    this.playPlaylist = this.playPlaylist.bind(this);
    this.shufflePlaylist = this.shufflePlaylist.bind(this);
    this.onSetItems = this.onSetItems.bind(this);
  }

  getPlaylistId() {
    return this.props.id || this.props.playlist.id;
  }

  onSetItems({ items }) {
    const playlistLength = items.reduce(
      (totalDuration, track) =>
        totalDuration + track.attributes ? track.attributes.durationInMillis : 0,
      0
    );

    this.setState({
      runtime: humanifyMillis(playlistLength),
      items,
    });
  }

  playSong({ index }) {
    MusicPlayerApi.playPlaylist(this.state.playlist, index);
  }

  async playPlaylist(index = 0) {
    MusicPlayerApi.playPlaylist(this.state.playlist, index);
  }

  async shufflePlaylist() {
    const randy = Math.floor(Math.random() * this.state.playlist.relationships.tracks.data.length);
    await this.playPlaylist(randy);
    MusicPlayerApi.shuffle();
  }

  render() {
    const { playlist, runtime, items } = this.state;

    if (!playlist) {
      return <Loader />;
    }

    const artworkURL = artworkForMediaItem(playlist, 100);
    const trackCount = playlist.attributes.trackCount || items.length;

    const music = MusicKit.getInstance();

    const isLibrary = this.getPlaylistId().startsWith('p.');
    const functionGenerator = (...args) =>
      isLibrary ? music.api.library.playlist(...args) : music.api.playlist(...args);

    return (
      <div className={classes.panel} ref={this.ref}>
        <div className={classes.header}>
          <div className={classes.headerMain}>
            <div className={classes.artworkWrapper}>
              <img src={artworkURL} alt={playlist.attributes.name} />
            </div>
            <div className={classes.titleWrapper}>
              <span className={classes.name}>{playlist.attributes.name}</span>
              <span className={classes.curator}>
                {`Playlist by ${playlist.attributes.curatorName}`}
              </span>
              <span className={classes.titleMeta}>{`${trackCount} songs, ${runtime}`}</span>
              <div className={classes.playActions}>
                <button type={'button'} onClick={this.playPlaylist} className={classes.button}>
                  <i className={`${classes.icon} fas fa-play`} />
                  Play
                </button>
                <button type={'button'} onClick={this.shufflePlaylist} className={classes.button}>
                  <i className={`${classes.icon} fas fa-random`} />
                  Shuffle
                </button>
              </div>
            </div>
          </div>
          {playlist.attributes.description && (
            <div className={classes.description}>
              <span
                dangerouslySetInnerHTML={{ __html: playlist.attributes.description.standard }} // eslint-disable-line react/no-danger
              />
            </div>
          )}
        </div>
        <div className={classes.main}>
          <SongList
            scrollElement={this.ref}
            scrollElementModifier={e => e && e.parentElement}
            load={MusicApi.infiniteLoadRelationships(
              this.getPlaylistId(),
              functionGenerator,
              'tracks',
              this.store
            )}
            album={false}
            showArtist
            showAlbum
            playSong={this.playSong}
            onSetItems={this.onSetItems}
          />
        </div>
      </div>
    );
  }
}

PlaylistPanel.propTypes = {
  playlist: PropTypes.any,
  id: PropTypes.any,
};

PlaylistPanel.defaultProps = {
  playlist: null,
  id: null,
};
