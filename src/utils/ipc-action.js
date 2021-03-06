import { ipcRenderer } from 'electron';
import Actions         from '../actions';
import RichState       from './rich-state';
import TimelineProxy   from './timeline-proxy';
import TwitterClient   from './twitter-client';

export default class IpcAction {
  static subscribe(store) {
    new IpcAction(store).subscribe();
  }

  constructor(store) {
    this.dispatch = store.dispatch;
    this.state = new RichState(store);
    store.subscribe(() => {
      this.state = new RichState(store);
    });
  }

  subscribe(store) {
    ipcRenderer.on('invoke-reply', (event) => {
      let tweet = this.state.activeTweet();
      if (!tweet) return null;

      this.dispatch(Actions.setText(`@${tweet.user.screen_name} `));
      this.dispatch(Actions.setInReplyTo(tweet));

      // FIXME: Use better way to focus
      document.getElementById('tweet_editor').focus();
    });

    ipcRenderer.on('invoke-retweet', (event) => {
      let active = this.state.activeTweet();
      if (!active) return null;

      if (window.confirm(`Are you sure to retweet?: ${active.text}`)) {
        this.client().retweetStatus(active.id_str, (tweet) => {
          this.dispatch(Actions.addTweet(tweet, this.state.activeAccount(), this.state.activeTab()));
        });
      }
    });

    ipcRenderer.on('invoke-delete', (event) => {
      let active = this.state.activeTweet();
      if (!active) return null;

      this.client().deleteStatus(active.id_str, (tweet) => {
        this.dispatch(Actions.removeTweet(tweet, this.state.activeAccount(), this.state.activeTab()));
      });
    });

    ipcRenderer.on('select-next-tab', (event) => {
      let tab = this.state.nextTab();
      this.dispatch(Actions.selectTab(tab, this.state.activeAccount()));
      this.updateMarkAsRead(tab);
    });

    ipcRenderer.on('select-prev-tab', (event) => {
      let tab = this.state.prevTab();
      this.dispatch(Actions.selectTab(tab, this.state.activeAccount()));
      this.updateMarkAsRead(tab);
    });

    ipcRenderer.on('select-next-account', (event) => {
      let index = this.state.nextAccountIndex();
      this.dispatch(Actions.activateAccount(index));
      this.refreshTime(index);
    });

    ipcRenderer.on('select-prev-account', (event) => {
      let index = this.state.prevAccountIndex();
      this.dispatch(Actions.activateAccount(index));
      this.refreshTime(index);
    });

    ipcRenderer.on('reload-timeline', (event) => {
      let proxy = new TimelineProxy(this.addTweet.bind(this), this.state.activeAccount());
      this.client().homeTimeline((tweets) => {
        for (let tweet of tweets) {
          proxy.addTweet(tweet);
        }
      });

      let listId = this.state.activeListId();
      if (listId) {
        this.client().listsStatuses(listId, (tweets) => {
          for (let tweet of tweets) {
            this.addTweet(tweet, this.state.activeAccount(), 'lists');
          }
        });
      }

      let query = this.state.activeSearchQuery();
      if (query) {
        this.client().searchTweets(query, (tweets) => {
          for (let tweet of tweets) {
            this.addTweet(tweet, this.state.activeAccount(), 'search');
          }
        });
      }
    });
  }

  addTweet(tweet, account, tab) {
    this.dispatch(Actions.addTweet(tweet, account, tab));
  }

  client() {
    return new TwitterClient(this.state.activeAccount());
  }

  refreshTime(index) {
    let account = this.state.state.accounts[index];
    let tab = this.state.state.selectedTabByUserId[account.id_str] || 'home';
    this.dispatch(Actions.refreshTabTime(tab, account));
  }

  updateMarkAsRead(tab) {
    if (tab === 'mentions') {
      let mention = this.state.latestMention();
      if (mention) {
        this.dispatch(Actions.markAsRead(mention, this.state.activeAccount()));
      }
    }
  }
}
