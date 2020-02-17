/**
 * @file
 * FCM javascript functions.
 */

const pushNotificationTokenUrl = '/api/v1/push-notification-tokens';
const pushNotificationsUrl = '/api/v1/push-notifications';
const pushNotificationsCountUrl = `${pushNotificationsUrl}/count`;

const DELETE_TOKEN = 'DELETE_TOKEN';
const CREATE_TOKEN = 'CREATE_TOKEN';
const NOTIFICATION_COUNT = 'NOTIFICATION_COUNT';
const POPULATE_NOTIFICATIONS = 'POPULATE_NOTIFICATIONS';
const DELETE_NOTIFICATION = 'DELETE_NOTIFICATION';

(function ($) {

  $(() => {
    const isUserIdDefined = setInterval(() => {
      if (userId !== 'undefined') {
        clearInterval(isUserIdDefined);
        fcm();
      }
    }, 100);
  });

  function fcm() {
    // if (!isAnonymous()) {
    //   notificationHttpRequest(pushNotificationsCountUrl, 'GET', undefined, NOTIFICATION_COUNT);
    // }
    // Initialize Firebase.
    // var firebaseConfig = {
    //   apiKey: "AIzaSyCMyTBifmLkziJBUtpDyfdsPVmYiqXob58",
    //   authDomain: "bbqn-test-app.firebaseapp.com",
    //   databaseURL: "https://bbqn-test-app.firebaseio.com",
    //   projectId: "bbqn-test-app",
    //   storageBucket: "bbqn-test-app.appspot.com",
    //   messagingSenderId: "577811943636",
    //   appId: "1:577811943636:web:60928a6c0e4ca513beeb41",
    //   measurementId: "G-WQS8JBSR92"
    // };

    var firebaseConfig = {
      apiKey: "AIzaSyADLdDX3OEdmklM9KktYtyjZ__awKGHx24",
      authDomain: "barbeque-nation-d7c0e.firebaseapp.com",
      databaseURL: "https://barbeque-nation-d7c0e.firebaseio.com",
      projectId: "barbeque-nation-d7c0e",
      storageBucket: "barbeque-nation-d7c0e.appspot.com",
      messagingSenderId: "155650652337",
      appId: "1:155650652337:web:bd7e6d165a91ef93078a90"
    };

    function setTokenSentToServer(status) {
      localStorage.setItem('tokenSentToServer', status);
    }

    function isTokenSentToServer() {
      if (localStorage.getItem('tokenIsAnonymous') && !isAnonymous()) {
        localStorage.removeItem('tokenIsAnonymous');
        return false;
      } else {
        return JSON.parse(window.localStorage.getItem('tokenSentToServer'));
      }
    }

    function saveTokenInLocal(token) {
      localStorage.setItem('fcmToken', token);
    }

    function deleteLocalToken() {
      localStorage.removeItem('fcmToken');
    }

    function getLocalToken() {
      return localStorage.getItem('fcmToken');
    }

    function sendTokenToServer(currentToken) {
      if (!isTokenSentToServer()) {
        if (currentToken) {
          notificationHttpRequest(pushNotificationTokenUrl, 'POST', new PushNotificationToken(currentToken), CREATE_TOKEN);
        }
      }
    }

    function deleteCurrentToken() {
      const token = getLocalToken();
      if (token) {
        notificationHttpRequest(pushNotificationTokenUrl, 'DELETE', new PushNotificationToken(token), DELETE_TOKEN);
      }
    }

    $(document).on('click', '.logout', (e) => {
      localStorage.setItem('tokenIsAnonymous', true);
      deleteCurrentToken();
    });

    $('.notifications').click(function (e) {
      e.preventDefault();
      notificationHttpRequest(pushNotificationsUrl, 'GET', undefined, POPULATE_NOTIFICATIONS);
      $('.notifications-snackbar').addClass('notifications-snackbar-active');
      $('.notifications-snackbar').fadeToggle();
    });

    function populateNotifications(notifications) {
      const count = notifications.length;
      let notificationHtml = '';
      if (count > 0) {
        notifications.forEach((notification) => {
          notificationHtml += getNotificationHtml(notification);
        });
        $('#notifications-count').text(count);
        $('#notification-content').html(notificationHtml);
      }
    }

    function getNotificationHtml(notification) {
      const img = notification.image ? notification.image : notification.icon;
      return `<a href="${getNotificationUrl(notification.notification_event, notification.entity_id)}" id="${notification.id}" class="row align-center notification-item">
                <div class="notifications-image"><img src="${img}" alt="image"/></div>
                <div class="notifications-content">
                  <div class="notifications-title">${notification.title}</div>
                  <div class="notifications-text">${notification.body}</div>
                </div>
              </a>`
    }

    $(document).on('click', '.notification-item', (e) => {
      e.preventDefault();
      const anchor = $(e.target).closest('a');
      const id = parseInt(anchor.attr('id'), 10);
      const url = anchor.attr('href');
      notificationHttpRequest(`${pushNotificationsUrl}/${id}`, 'DELETE', undefined, DELETE_NOTIFICATION, url);
    });

    function getNotificationUrl(type, entityId) {
      if (type === 'voucher') {
        return `/product/${entityId}`;
      } else if (type === 'booking') {
        return '/profile#reservations';
      } else if (type === 'loyalty') {
        return '/profile#smiles';
      } else {
        return `/node/${entityId}`;
      }
    }

    $('.notifications-close').click(function (e) {
      e.preventDefault();
      $('.notifications-snackbar').removeClass('notifications-snackbar-active');
      $('.notifications-snackbar').fadeOut();
    });

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();

      messaging
        .requestPermission()
        .then(function () {
          console.log("Notification permission granted.");
          messaging.getToken()
            .then(function (token) {
              sendTokenToServer(token);
            });
        })
        .catch(function (err) {
          console.log("Unable to get permission to notify.", err);
        });

      messaging.onMessage(function (payload) {
        if (payload.notification) {
          const title = payload.notification.title;
          const options = {
            body: payload.notification.body,
            icon: payload.notification.icon,
          };
          if (!("Notification" in window)) {
            console.log("This browser does not support system notifications");
          } else if (Notification.permission === "granted") {
            var notification = new Notification(title, options);
            notification.onclick = function (e) {
              e.preventDefault();
              window.open(payload.fcmOptions.link);
              notification.close();
            };
          }
        }
      });

      messaging.onTokenRefresh(function () {
        messaging.getToken()
          .then(function (newToken) {
            if (getLocalToken() !== newToken) {
              deleteCurrentToken();
              sendTokenToServer(newToken);
            }
          })
      });
    }

    function loaderStop() {
      $('.fakeLoader').removeClass('display-block');
      $('.fakeLoader').addClass('hide');
    }

    function loaderStart() {
      $('.fakeLoader').removeClass('hide');
      $('.fakeLoader').addClass('display-block');
    }

    function notificationHttpRequest(url, method = 'GET', data, type, options) {
      $.ajax({
        dataType: 'json',
        url,
        async: !(type === DELETE_TOKEN || CREATE_TOKEN),
        headers: getHeaders(),
        beforeSend: function () {
          loaderStart();
        },
        complete: function () {
          loaderStop();
        },
        method: method,
        data: data ? JSON.stringify(data) : undefined,
        success(successData) {
          if (type === DELETE_TOKEN) {
            setTokenSentToServer(false);
            deleteLocalToken();
          }
          if (type === CREATE_TOKEN) {
            setTokenSentToServer(true);
            saveTokenInLocal(data.token);
          }
          // if (type === NOTIFICATION_COUNT) {
          //   $('#notifications-count').text(successData.count);
          // }
          if (type === POPULATE_NOTIFICATIONS) {
            populateNotifications(successData);
          }
          if (type === DELETE_NOTIFICATION) {
            window.location.href = options;
          }
        }
      });
    }
  }

})(jQuery);


class PushNotificationToken {
  constructor(token) {
    this.token = token;
    this.device_type = 'WEB';
  }
}
