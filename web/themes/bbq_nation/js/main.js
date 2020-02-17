(function ($, Drupal) {
  Drupal.behaviors.bbqCommon = {
    attach: function (context, settings) {
      $(document).ready(function () {
        // Latest Update Slider.
        $('.updates-carousel .view-content').not('.slick-initialized').slick({
          infinite: true,
          slidesToShow: 3,
          slidesToScroll: 1,
          prevArrow: false,
          nextArrow: false,
          dots: true,
          responsive: [{
              breakpoint: 1024,
              settings: {
                slidesToShow: 3,
                slidesToScroll: 1,
                mobileFirst: true,
              }
            },
            {
              breakpoint: 680,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 2,
                mobileFirst: true,
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                mobileFirst: true,
                swipeToSlide: true,
                infinite: true,
                speed: 500,
              }
            }
          ]
        });
        // Megamenu
        $('.menuToggle').click(function () {
          if ($(window).width() >= 1024) {
            $('.menu-wrap').slideDown();
            $('body').addClass('show');
            return;
          } else {
            $('.menu-wrap').addClass('show');
          }
        });
        $(document).mouseup(function (e) {
          var container = $('.menu-wrap--container'); // YOUR CONTAINER SELECTOR

          if (!container.is(e.target) // if the target of the click isn't the container...
            &&
            container.has(e.target).length === 0) // ... nor a descendant of the container
          {
            $('.menu-wrap').removeClass('show');
            $('.user').removeClass('show');
            $('.notifications-snackbar').removeClass('notifications-snackbar-active');
          }
        });

        // MegaMenu Active Link
        var path = window.location.href.split('#')[0];
        $('.main-nav li a').each(function () {
          if (this.href === path) {
            $(this).addClass('active');
          }
        });
        if ($('.ui-front').children().children().hasClass('webform--current-job-opening')) {
          $('.ui-dialog').once().wrap("<div class='career-page'></div>");
        }

        $('.career-page .ui-icon-closethick').click(function () {
          $('.career-page .ui-dialog').unwrap();
        })

        $(document).mouseup(function (e) {
          var userDropdown = $('.user--dropdown'); // YOUR CONTAINER SELECTOR

          if (!userDropdown.is(e.target) // if the target of the click isn't the container...
            &&
            userDropdown.has(e.target).length === 0) // ... nor a descendant of the container
          {
            $('.user-nav').removeClass('show');
          }
        });

        $('.menu-close').click(function () {
          if ($(window).width() >= 1024) {
            $('.menu-wrap').slideUp();
            $('body').removeClass('show');
            return;
          } else {
            $('.menu-wrap').removeClass('show');
          }
        });

        $('.banner-carousel').slick({
          infinite: true,
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
          arrows: false,
          fade: true,
          speed: 1000,
          autoplay: true,
        });

        $(document,context).once('bbqCommon').on('click', '.accordion-header', function (e) {
          e.preventDefault();

          var $this = $(this);

          if ($this.next().hasClass('show')) {
            $this.next().removeClass('show');
            $this.next().slideUp(200);
            $this.parent().removeClass('active');
          } else {
            $this.next().toggleClass('show');
            $this.next().slideToggle(400);
            $this.parent().addClass('active');
            $this.toggleClass('active');
          }
        });

        $('.refund__card input:radio').click(function () {
          $('.refund__card').removeClass('selected');
          $(this).parent().addClass('selected');
        });
      });
      //$('.country--code').select2();
      $('.navbar__toggler').click(function () {
        $(this).toggleClass('is-open');
        $(this).next().toggleClass('is-open');
      });
      $('.user').click(function () {
        $(this).toggleClass('show');
      });
      $('.user').click(function () {
        $('.login--modal').addClass('show');
      });
      $('.login--modal-close').click(function () {
        $('.login--modal').removeClass('show');
      });
      $('.card--voucher .button--atc').click(function (e) {
        e.preventDefault();
        $(this).next().show();
        $(this).hide();
      });

      $('.voucher--details .button--atc').click(function (e) {
        e.preventDefault();
        $(this).next().show();
        $(this).hide();
      });

      $('.card--promotion .button--atc').click(function (e) {
        e.preventDefault();
        $(this).next().show();
        $(this).hide();
      });

      function increaseValue() {
        console.log($(this).prev().value);
        var value = parseInt($(this).prev().value, 10);
        value = isNaN(value) ? 0 : value;
        if (value < 10) {
          value++;
        }
        $(this).prev().value = value;
      }

      function decreaseValue() {
        var value = parseInt($(this).next().value, 10);
        value = isNaN(value) ? 0 : value;
        value < 1 ? value = 1 : '';
        value--;
        $(this).next().value = value;
      }
      $('.checkbox-list').each(function () {
        var count = $(this).children().length;
        if (count > 5 && !$(this).hasClass('checkbox-list--expanded')) {
          $(this).addClass('checkbox-list--collapsed');
          var remaining = count - 5;
          $(this).append('<a href=\'#\' class=\'checkbox-list__button\'>+' + remaining + ' More</a>')
        } else {
          $(this).addClass('checkbox-list--expanded');
        }
      });
      $('.checkbox-list__button').click(function (e) {
        e.preventDefault();
        $(this).parent().removeClass('checkbox-list--collapsed');
        $(this).parent().addClass('checkbox-list--expanded');
        $(this).hide();
      });
      $('.button--m-filter').click(function () {
        $('.l-filter').addClass('l-filter--show-m');
      });
      $('.l-filter__submit .button').click(function () {
        $('.l-filter').removeClass('l-filter--show-m');
      });
      $('.button--m-sort').click(function () {
        if ($(this).hasClass('button--m-sort--asc')) {
          $(this).removeClass('button--m-sort--asc');
          $(this).addClass('button--m-sort--desc');
        } else {
          $(this).removeClass('button--m-sort--desc');
          $(this).addClass('button--m-sort--asc');
        }
      });

      // Open signin popup.
      $('.button--signin').click(function () {
        $('#signin-dialog').load('signin.html', function () {
          $('.form--signin .form__suffix a').click(function (e) {
            $('.form--signin').hide();
            $('.form--signup').show();
            e.preventDefault();
          });
          $('.form--signup .form__suffix a').click(function (e) {
            $('.form--signup').hide();
            $('.form--signin').show();
            e.preventDefault();
          });
          $('.button--submit-next').click(function (e) {
            $('.form--signup').hide();
            $('.form--signin').show();
            setTimeout(function () {
              e.preventDefault();
            }, 3000);
          })
          $('.button--form-signin').click(function (e) {
            if ($('.form--signin').submit()) {
              e.preventDefault();
              $('.signin__form-wrapper').hide();
              $('.signin__success').show();
              transferC
            }
            setTimeout(function () {
              $('.form--signin').submit();
            }, 1000);
          });
          $('#timer').html('03:00');
          startTimer();
          $('#signin-dialog .close').click(function (e) {
            $('#signin-dialog').children().remove();
            e.preventDefault();
          });
        });
      });

      function startTimer() {
        var presentTime = document.getElementById('timer').innerHTML;
        var timeArray = presentTime.split(/[:]+/);
        var m = timeArray[0];
        var s = checkSecond((timeArray[1] - 1));
        if (s == 59) {
          m = m - 1
        }
        //if(m<0){alert('timer completed')}
        document.getElementById('timer').innerHTML =
          m + ':' + s;
        setTimeout(startTimer, 1000);
      }

      function checkSecond(sec) {
        if (sec < 10 && sec >= 0) {
          sec = '0' + sec
        }; // add zero in front of numbers < 10
        if (sec < 0) {
          sec = '59'
        };
        return sec;
      }
      $(document).on('click', '.reservation--curtain .reservation__heading-action', function (e) {
        $('.reservation--curtain').removeClass('reservation--visible');
        $('input[name="reason"]').prop('checked', false);
        $('input[name="refund"]').prop('checked', false);
        e.preventDefault();
      });
      $('#buffet-link').click(function (e) {
        e.preventDefault();
        $('#a-la-carte').hide();
        $('#buffet').show();
        $('#beverages').hide();
      })
      $('#a-la-carte-link').click(function (e) {
        e.preventDefault();
        $('#a-la-carte').show();
        $('#buffet').hide();
        $('#beverages').hide();
      })
      $('#beverages-link').click(function (e) {
        e.preventDefault();
        $('#a-la-carte').hide();
        $('#buffet').hide();
        $('#beverages').show();
      })


      //Voucher details accordion
      $('.voucher--info .info__content .info h3', context).click(function () {
        $(this).toggleClass('dropdown--expand');
        $(this).next().slideToggle(500);
      })

      //Promotion details accordion
      $('.promotion--info .info__content .info h3', context).click(function () {
        $(this).toggleClass('dropdown--expand');
        $(this).next().slideToggle(500);
      })


      function isOnScreen(elem) {
        // if the element doesn't exist, abort
        if (elem.length == 0) {
          return;
        }
        var $window = jQuery(window)
        var viewport_top = $window.scrollTop()
        var viewport_height = $window.height()
        var viewport_bottom = viewport_top + viewport_height
        var $elem = jQuery(elem)
        var top = $elem.offset().top
        var height = $elem.height()
        var bottom = top + height
        return (top >= viewport_top && top < viewport_bottom) ||
          (bottom > viewport_top && bottom <= viewport_bottom) ||
          (height > viewport_height && top <= viewport_top && bottom >= viewport_bottom)
      }
      $(document).ready(function () {
        window.addEventListener('scroll', function (e) {
          if (isOnScreen(jQuery('.s-offers .layout-container'))) {
            /* Pass element id/class you want to check */
            $(".store-reservation-form").addClass("store-reservation-form--static");
          } else {
            $(".store-reservation-form").removeClass("store-reservation-form--static");
          }
        });
      });

      // Image gallery in store/branch detail page
      var imageCountmob = $('.field-content .colorbox').length;
      var imageCount = imageCountmob - 5;
      var limit = 4;
      for (var i = 0; i <= 4; i++) {
        $('.view-gallery .field-content a').eq(i).addClass('s-gallery-item');
      }
      $('.view-gallery .field-content a').eq(0).addClass('s-gallery-item--first').append('<span>' + imageCountmob + ' PHOTOS </span>');
      $('.view-gallery .field-content a', context).eq(4).addClass('s-gallery-item s-gallery-item--last').wrap('<div class= "wrapper-right"> </div>');
      if(imageCountmob > 5) {
        $('.view-gallery .field-content a').eq(4).append('<span>' + imageCount + ' PHOTOS </span>');
      }

      $("#target_gallery", context).click(function (e) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: $("#gallery").offset().top - 100
        }, 1000);
      });

      $("#target_offers", context).click(function (e) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: $("#offers").offset().top - 100
        }, 1000);
      });
      $("#target_overview", context).click(function (e) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: $("#overview").offset().top - 100
        }, 1000);
      });

      $('.c-form__country-code,.c-form__mobile', context).wrapAll('<div class="c-form__phone"></div>');

      // Gallery Slider Starts

      $('.paragraph__gallery-slider').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        fade: false,
        arrows: true,
        adaptiveHeight: true,
        infinite: false,
        useTransform: true,
        speed: 500,
        cssEase: 'cubic-bezier(0.77, 0, 0.18, 1)',
        responsive: [{
            breakpoint: 1024,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              mobileFirst: true,
            }
          },
          {
            breakpoint: 680,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              mobileFirst: true,
            }
          },
          {
            breakpoint: 480,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              mobileFirst: true,
              swipeToSlide: true,
            }
          }
        ]
      });

      $('.paragraph__gallery-nav')
        .on('init', function (event, slick) {
          $('.paragraph__gallery-nav .slick-slide.slick-current').addClass('is-active');
        })
        .slick({
          slidesToShow: 9,
          slidesToScroll: 9,
          dots: false,
          focusOnSelect: false,
          infinite: false,
          arrows: false,
          responsive: [{
            breakpoint: 1024,
            settings: {
              slidesToShow: 5,
              slidesToScroll: 5,
            }
          }, {
            breakpoint: 640,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 4,
            }
          }, {
            breakpoint: 420,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 3,
            }
          }]
        });

      $('.paragraph__gallery-slider').on('afterChange', function (event, slick, currentSlide) {
        $('.paragraph__gallery-nav').slick('slickGoTo', currentSlide);
        var currrentNavSlideElem = '.paragraph__gallery-nav .slick-slide[data-slick-index="' + currentSlide + '"]';
        $('.paragraph__gallery-nav .slick-slide.is-active').removeClass('is-active');
        $(currrentNavSlideElem).addClass('is-active');
      });

      $('.paragraph__gallery-nav').on('click', '.slick-slide', function (event) {
        event.preventDefault();
        var goToSingleSlide = $(this).data('slick-index');

        $('.paragraph__gallery-slider').slick('slickGoTo', goToSingleSlide);
      });

      // Gallery Slider Ends

      $('.paragraph__testimonial-section').slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        dots: true,
        responsive: [{
            breakpoint: 1024,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 1,
              mobileFirst: true,
            }
          },
          {
            breakpoint: 680,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              mobileFirst: true,
            }
          },
          {
            breakpoint: 480,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              mobileFirst: true,
              swipeToSlide: true,
              speed: 500,
            }
          }
        ]
      });

      $("#apply-job-posting", context).click(function (e) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: $("#webform-job-posting").offset().top - 100
        }, 1000);
      });

      $("#enquire-now-button", context).click(function (e) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: $("#enquire-now").offset().top - 100
        }, 1000);
      });

      $(".mobile-reserve-button .input--group-button", context).click(function (e) {
        $('.form--banner').css({"display": "block","margin-top": "0px"});
        $('#header').css("display", "none");
        $('.mobile-reserve-button').hide();
      });

      $(".form--banner .close", context).click(function (e) {
        $('.form--banner').css({"display": "none","margin-top": "60px"});
        $('#header').css("display", "flex");
        $('.mobile-reserve-button').show();
      });

      $("#target_menu", context).click(function (e) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: $("#s-branch-menu-tab").offset().top - 100
        }, 1000);
      });
      $("#target_gallery", context).click(function (e) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: $("#gallery").offset().top - 100
        }, 1000);
      });
      $("#target_offers", context).click(function (e) {
        e.preventDefault();
        $('html, body').animate({
          scrollTop: $("#offers").offset().top - 100
        }, 1000);
      });

      var links = $('.s-menu__item > .s-menu__link');
      links.on('click', function() {
        links.closest('.s-menu__item').removeClass('active');
          $(this).closest('.s-menu__item').addClass('active');
      });

      $('.social-links .social-media-links--platforms li  a').attr('target', '_blank');

      $(".promotion-copy-code", context).click(function (e) {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val($('#promotion-coupon').text()).select();
        document.execCommand("copy");
        $temp.remove();
      });

      var element = document.getElementsByClassName('messages--status');

      if(element[0]) {
        //todo handle stringmatch
        document.querySelector(".messages--status h2").style.display="none";
        if((element[0].innerText == 'Your message has been sent.') || ( element[0].innerText == 'Your message sent successfully')){
          toastr.success(element[0].innerText);
        }
        element[0].setAttribute("style", "display:none;");
      }

      $(".branch-dropdown-options", context).click(function (e) {
        $(this).find('.select2-selection').toggleClass('show');
      });

        $('.s-voucher__header .header__m-filter .button--m-sort',context).click(function () {
          if ($(this).hasClass('button--m-sort--asc')) {
            $('#voucher-filter-sort-dropdown').val(2).trigger('change');
          } else {
            $('#voucher-filter-sort-dropdown').val(1).trigger('change');
          }
        });
    }
  };

  $('.blogs--detailed-share-button .addtoany_share').append('<span>Share</span>');
  $('.news--detailed-share-button .addtoany_share').append('<span>Share</span>');
})(jQuery, Drupal);
