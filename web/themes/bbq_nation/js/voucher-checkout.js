const voucherCartUrl = '/api/v1/cart';
const generateRazorpayOrderUrl = '/api/v1/cart/generate-rp-order';
const checkoutUrl = '/api/v1/cart/checkout';
const cartTransferUrl = '/api/v1/cart/transfer/';
const userCartCouponsUrl = '/api/v1/vouchers?transaction_type=PURCHASE&voucher_type=GC';
const getCartLoyaltyExchangeRateUrl = '/api/v1/loyalty-points-value';

const clientId = '1207f98b-8419-4a6c-a296-5b0fb1717169';
const clientSecret = 'Abcd@123';
let orderId;
let orderItems = [];
let cartCurrencyCode;
let cartCurrency;

let userId;

let cartApplyLoyalty;

let cartLoyaltyPoints;
let cartLoyaltyExchangeRate;

let cartLoyaltyPointsApplied;
let cartLoyaltyDiscountApplied;

// voucher listing

let voucherFilters;
const voucherListingUrl = '/api/v1/search/vouchers';
const voucherDetailUrl = '/api/v1/voucher-details/';
let voucherPageSize;
let voucherFilterObject = {};
let voucherTotalElements;
let voucherPageNumber;
let voucherCurrentPageLength;
let filterMinPriceSlider;
let filterMaxPriceSlider;
let filterSelectedMinPrice;
let filterSelectedMaxPrice;

// promotion listing
const promotionListingUrl = '/api/v1/search/promotions';

let cartCouponsList = new Map();
let cartAppliedCoupon;

let cartTotal;

function isHomePage() {
  return window.location.pathname === '/';
}

(function ($, Drupal) {
  Drupal.behaviors.bbqBooking = {
    attach: function (context, settings) {
      userId = settings.user.uid;
    }
  };

  $.fakeLoader({
    spinner: 'spinner6',
    bgColor: 'rgba(0, 0, 0, 0.5)'
  });

  class Voucher {
    constructor(voucher) {
      this.barCode = voucher.bar_code;
      this.currency = voucher.currency;
      this.denomination = voucher.denomination;
      this.title = voucher.title;
      this.description = voucher.description;
      this.applicability = voucher.applicability;
    }
  }

  function updateCartCount() {
    $('#cart-count').html(orderItems.length);
  }

  function isVoucherPage() {
    return window.location.pathname === '/vouchers';
  }

  function isPromotionPage() {
    return window.location.pathname === '/promotions';
  }

  function isVoucherDetailPage() {
    return window.location.pathname.match(/\/(vouchers.+)/);
  }

  function getUserLoyaltyPoints() {
    $.get({
      beforeSend: function () {
        loaderStart();
      },
      complete: function () {
        loaderStop();
      },
      url: getCartLoyaltyExchangeRateUrl,
      data: {amount: 1, currency: cartCurrency},
      success(data) {
        cartLoyaltyPoints = data.available_points;
        cartLoyaltyExchangeRate = data.redeem_amount / data.redeemable_points;
        calculateLoyaltyPoints();
      }
    });
  }

  function calculateLoyaltyPoints() {
    if (cartLoyaltyPoints && cartLoyaltyPoints > 0 && cartLoyaltyExchangeRate) {
      const applicableLoyaltyPoints = getCartTotal(true) / cartLoyaltyExchangeRate;
      if (cartLoyaltyPoints >= applicableLoyaltyPoints) {
        cartLoyaltyPointsApplied = applicableLoyaltyPoints;
      } else {
        cartLoyaltyPointsApplied = cartLoyaltyPoints;
      }
      cartLoyaltyDiscountApplied = cartLoyaltyPointsApplied * cartLoyaltyExchangeRate;
      setLoyaltyPointsHtml();
    } else {
      $('#cart-loyalty-points').empty();
    }
  }


  $(document).on('click', '#apply-cart-loyalty-points', (e) => {
    cartApplyLoyalty = true;
    setAmountDetails();
  });

  $(document).on('click', '#remove-cart-loyalty-points', (e) => {
    cartApplyLoyalty = false;
    setAmountDetails();
  });

  function setAmountDetails() {
    calculateLoyaltyPoints();
    setCartTotal();
  }

  function setLoyaltyPointsHtml() {
    let anchorLink;
    let loyaltyText;
    let skipLoyalty = false;
    if (cartApplyLoyalty) {
      anchorLink = '<a href="#" class="remove-link" id="remove-cart-loyalty-points">Remove</a>';
      loyaltyText = Math.round(cartLoyaltyPointsApplied) + ' BBQN points applied for this transaction';
    } else {
      if (getCartTotal() > 0) {
        anchorLink = `<a href="#" class="add-link" id="apply-cart-loyalty-points">Add</a>`;
        loyaltyText = cartCurrencyCode + cartLoyaltyDiscountApplied.toFixed(2) + ' discount applicable by using ' + Math.round(cartLoyaltyPointsApplied) + ' BBQN points';
      } else {
        skipLoyalty = true;
      }
    }
    if (!skipLoyalty) {
      let loyaltyHtml = `<div class="left">
                          <div class="heading">
                            <h5>BBQN Smiles</h5>
                            ${anchorLink}
                          </div>
                          <span>${loyaltyText}</span>
                          <a href="#" class="t-and-c-text">*T&Cs applicable</a>
                        </div>`;
      if (cartApplyLoyalty) {
        loyaltyHtml += `<div class="right">- ${cartCurrencyCode}${cartLoyaltyDiscountApplied.toFixed(2)}</div>`;
      }
      $('#cart-loyalty-points').html(loyaltyHtml);
    } else {
      $('#cart-loyalty-points').empty();
    }
  }

  $('#cart-show-coupons').click((e) => {
    $('#cart-main-info').hide();
    $('#cart-coupons').show();
    $.get({
      beforeSend: function () {
        loaderStart();
      },
      complete: function () {
        loaderStop();
      },
      url: userCartCouponsUrl,
      success(data) {
        loadCoupons(data);
      }
    });
  });

  $(document).on('click', '.t-and-c-text', (e) => {
    e.preventDefault();
    const redirectWindow = window.open('/terms-condition', '_blank');
    redirectWindow.location;
  });

  function loadCoupons(data) {
    data.vouchers.forEach((coupon) => {
      cartCouponsList.set(coupon.bar_code, new Voucher(coupon));
    });
    if (data.vouchers && data.vouchers.length > 0) {
      buildCouponsHtml();
    } else {
      $('#cart-coupons-listing').html('<div>No coupons available.</div>');
    }
  }

  function buildCouponsHtml() {
    let couponHtml = '';
    cartCouponsList.forEach((v, k) => {
      const couponItem = couponItemHtml(v.title, v.barCode, v.currency, v.denomination, getCartTotal(), v.description, v.applicability);
      if (couponItem) {
        couponHtml += couponItem;
      }
    });
    $('#cart-coupons-listing').html(couponHtml);
  }

  function couponItemHtml(title, code, currency, amount, tempSubTotal, description, applicability) {
    let couponClass = 'cart-apply-coupon';
    let couponText = 'Apply coupon';
    if (cartAppliedCoupon) {
      if (code === cartAppliedCoupon) {
        couponClass = 'coupon-applied';
        couponText = 'Applied';
      } else {
        couponClass += ' anchor-disabled';
      }
    }
    if (amount > tempSubTotal) {
      if (couponClass.substr(0, 14) !== 'coupon-applied') {
        couponClass += ' anchor-disabled';
      }
    }
    if (!applicability) {
      couponClass = 'anchor-disabled';
    }
    return `<div class="coupon-card row align-center space-between">
            <div class="coupon__left">
              <div class="coupon-title">${title}</div>
              <div class="coupon-description">${getCurrencyCode(currency)}${amount.toLocaleString("en")} OFF</div>
              ${getCouponDescription(description)}
            </div>
            <div class="coupon__right">
              <div class="coupon-cta">
                <a id="${code}" class="${couponClass}" href="#">${couponText}</a>
              </div>
              <div class="coupon-code">Code:
                <span>${code}</span>
              </div>
            </div>
          </div>`
  }

  $('.cart--curtain .close').click(function (e) {
    $('.cart--curtain').removeClass('cart--visible');
    e.preventDefault();
    cartAppliedCoupon = undefined;
    cartApplyLoyalty = undefined;
    cartLoyaltyPointsApplied = undefined;
    cartLoyaltyExchangeRate = undefined;
    cartLoyaltyPoints = undefined;
    $('#cart-applied-vouchers').empty();
    enableCouponLink();
  });

  $('#cart-coupons-vouchers-close').click((e) => {
    e.stopPropagation();
    $('#cart-coupons').hide();
    $('#cart-main-info').show();
  });

  function getCartTotal(loyalty = false, coupon = false) {
    let total = cartTotal;
    if (cartApplyLoyalty && !loyalty) {
      total -= cartLoyaltyDiscountApplied;
    }
    if (cartAppliedCoupon && !coupon) {
      total -= cartCouponsList.get(cartAppliedCoupon).denomination;
    }
    return total;
  }

  function setCartTotal() {
    $('#cart-total-price').html(`${cartCurrencyCode}${getCartTotal().toLocaleString("en")}`);
  }

  $(document).on('click', '.cart-apply-coupon', (e) => {
    const barCode = e.target.id;
    const voucher = cartCouponsList.get(barCode);
    const validCoupon = validateTotal(voucher.denomination, getCartTotal());
    if (validCoupon) {
      disableCouponLink();
      cartAppliedCoupon = voucher.barCode;
      buildCouponsHtml();
      $('#cart-applied-vouchers').append(appliedCouponHtml(voucher));
      setAmountDetails();
    }
  });

  $(document).on('click', '.cart-remove-coupon', () => {
    cartAppliedCoupon = undefined;
    $('#cart-applied-vouchers').empty();
    enableCouponLink();
    setAmountDetails();
  });

  function appliedCouponHtml(voucher) {
    if (voucher) {
      let divId = `applied-coupon-${voucher.barCode}`;
      const offerText = `${getCurrencyCode(voucher.currency)} ${voucher.denomination.toLocaleString("en")} discount on the bill`;
      return `<div id=${divId} class="left">
                <div class="heading row align-center">
                  <h5 class="coupon">${voucher.barCode}</h5>
                  <a href="#" id="${voucher.barCode}" class="remove-link cart-remove-coupon">Remove</a>
                </div>
                <span>${offerText}</span>
              </div>`;
    }
  }

  function disableCouponLink() {
    $('#cart-show-coupons').addClass('anchor-disabled');
  }

  function enableCouponLink() {
    $('#cart-show-coupons').removeClass('anchor-disabled');
  }

  function validateTotal(amount, total) {
    if (amount > total) {
      toastr.error('Please add more items to apply this coupon');
      return false;
    }
    return true;
  }

  function getCart() {
    const localOrderId = localStorage.getItem('orderId');
    let queryParam;
    if (localOrderId) {
      queryParam = {order_id: parseInt(localOrderId, 10)};
    }
    $.ajax({
      dataType: 'json',
      method: 'GET',
      url: voucherCartUrl,
      beforeSend: function () {
        loaderStart();
      },
      complete: function () {
        loaderStop();
      },
      data: queryParam,
      headers: getHeaders(),
      success(data) {
        if ($.isEmptyObject(data) || (data && data.order_items && data.order_items.length === 0)) {
          showEmptyCart();
        } else if (data && data.order_items && data.order_items.length > 0) {
          orderId = data.order_id;
          $('#cart-title').text(`My Cart (${data.order_items.length} Items)`);
          let cartItemsHtml = '';
          if (!cartCurrency) {
            cartCurrency = data.currency_code;
          }
          if (!cartCurrencyCode) {
            cartCurrencyCode = getCurrencyCode(cartCurrency);
          }
          orderItems = [];
          data.order_items.forEach((item) => {
            orderItems.push(new OrderItem(item));
            const unitPrice = `${cartCurrencyCode}${item.unit_price.toLocaleString("en")}`;
            const totalPrice = `${cartCurrencyCode}${item.total_price.toLocaleString("en")}`;
            cartItemsHtml += getCartItemHtml(item.image, item.title, unitPrice, totalPrice, item.product_id, item.quantity);
          });
          $('#cart-items').html(cartItemsHtml);
          cartTotal = data.total_price;
          if (isAnonymous()) {
            $('#cart-coupon-loyalty-points').hide();
          } else {
            getUserLoyaltyPoints();
          }
          setAmountDetails();
        }
        updateCartCount();
      },
    });
  }

  function showEmptyCart() {
    $('#cart-items-coupons-loyalty-total').hide();
    $('#cart-title').text('You have no items in your cart');
  }

  function getCartItemHtml(image, title, unitPrice, totalPrice, productId, quantity) {
    return `<div id="cart-line-item-${productId}" class="cart__item">
            <img src="${image}" alt="V1">
            <div class="cart__item__title">
                <h5>${title}</h5>
                <span>${unitPrice}</span>
            </div>
            <div class="cart__item__form-wrap">
                <form id="cart-voucher-${productId}" class="form form--cart">
                    <div class="value-button cart-decrease-item"></div>
                    <input class="voucher-quantity-${productId}" class="" type="text" class="number" value="${quantity}" readonly/>
                    <div class="value-button cart-increase-item"></div>
                </form>
            </div>
            <div id="cart-line-item-total-${productId}" class="cart__item__total">
                ${totalPrice.toLocaleString("en")}
            </div>
        </div>`
  }

  function updateAllVouchers(items) {
    if (items.length > 0) {
      orderItems = [];
      items.forEach((item) => {
        orderItems.push(new OrderItem(item));
        const productId = item.product_id;
        const addToCartButton = $(`#add-to-cart-${productId}`);
        addToCartButton.next().show();
        addToCartButton.hide();
        const quantityElement = $(`.voucher-quantity-${productId}`);
        quantityElement.val(item.quantity);
      });
      updateCartCount();
    }
  }

  function voucherHttpRequest(url, requestMethod = 'GET', postData, populateAll, productId, isCart = false) {
    $.ajax({
      dataType: 'json',
      method: requestMethod,
      beforeSend: function () {
        loaderStart();
      },
      complete: function () {
        loaderStop();
      },
      url,
      data: populateAll ? postData : JSON.stringify(postData),
      headers: getHeaders(),
      success(data) {
        if (data.order_id) {
          if (populateAll) {
            orderId = data.order_id;
            updateAllVouchers(data.order_items);
          } else {
            updateOrder(data, productId, isCart);
          }
        }
      },
    });
  }

  function redirectToVouchers() {
    setTimeout(function () {
      window.location.href = '/profile#vouchers';
    }, 1000);
  }

  function updateOrder(data, isCart) {
    if (!orderId) {
      orderId = data.order_id;
      localStorage.setItem('orderId', orderId);
    }
    orderItems = [];
    $('#cart-total-price').html(`${cartCurrencyCode}${data.total_price.toLocaleString("en")}`);
    data.order_items.forEach((orderItem) => {
      $(`.voucher-quantity-${orderItem.product_id}`).val(orderItem.quantity);
      if (isCart) {
        $(`#cart-line-item-total-${orderItem.product_id}`).html(`${cartCurrencyCode}${orderItem.total_price}`);
      }
      orderItems.push(new OrderItem(orderItem));
    });
    if (isCart) {
      cartTotal = data.total_price;
      setAmountDetails();
      if (orderItems.length === 0) {
        showEmptyCart();
      } else {
        $('#cart-title').text(`My Cart (${orderItems.length} Items)`);
        $('#cart-main-info').children().filter(':not(.cart__heading)').show();
      }
    }
    updateCartCount();
  }

  function getVoucherId(event, isCart = false) {
    if (isCart) {
      return parseInt($(event.target).closest('form').attr('id').substr(13), 10);
    } else {
      return parseInt($(event.target).closest('article').attr('id'), 10);
    }
  }

  function addToCart(event, update = true, increase = true, isCart = false) {
    const productId = getVoucherId(event, isCart);
    const quantityElement = $(`.voucher-quantity-${productId}`);
    let currentQuantity = parseInt(quantityElement.val(), 10);
    if (increase) {
      currentQuantity++;
      if (update) {
        const orderItemId = orderItems.find((item) => item.productId === productId).orderItemId;
        const body = new VoucherPostData(undefined, orderItemId, currentQuantity);
        voucherHttpRequest(voucherCartUrl, 'PUT', body, false, productId, isCart);
      } else {
        const body = new VoucherPostData(productId, undefined, currentQuantity);
        voucherHttpRequest(voucherCartUrl, 'POST', body, false, productId, isCart);
      }
    } else {
      let orderItemId;
      let unitPrice;
      for (let i = 0; i < orderItems.length; i++) {
        if (orderItems[i].productId === productId) {
          orderItemId = orderItems[i].orderItemId;
          unitPrice = orderItems[i].unitPrice;
        }
      }
      cartAppliedCoupon = undefined;
      $('#cart-applied-vouchers').empty();
      enableCouponLink();
      if (currentQuantity > 1) {
        currentQuantity--;
        const body = new VoucherPostData(undefined, orderItemId, currentQuantity);
        voucherHttpRequest(voucherCartUrl, 'PUT', body, false, productId, isCart);
      } else {
        quantityElement.val(0);
        if (isVoucherPage() || isHomePage() || isVoucherDetailPage()) {
          const addToCartButton = $(`#add-to-cart-${productId}`);
          addToCartButton.show();
          addToCartButton.next().hide();
        }
        if ((isVoucherPage() || isHomePage() || isVoucherDetailPage()) && isCart) {
          const addToCartButton = $(`#add-to-cart-${productId}`);
          addToCartButton.show();
          addToCartButton.next().hide();
          $(`#cart-line-item-${productId}`).remove();
        } else {
          $(`#cart-line-item-${productId}`).remove();
        }
        voucherHttpRequest(`${voucherCartUrl}/${orderId}/${orderItemId}`, 'DELETE', undefined, false, productId, isCart);
      }
    }
  }

  $('.show-cart').click(function (e) {
    $('.cart--curtain').addClass('cart--visible');
    e.preventDefault();
    getCart();
  });

  $(document).on('click', '.button--atc', (e) => {
    const addToCartButton = $(`#add-to-cart-${getVoucherId(e)}`);
    addToCartButton.next().show();
    addToCartButton.hide();
    addToCart(e, false);
  });

  $(document).on('click', '.increase-item', (e) => {
    addToCart(e);
  });

  $(document).on('click', '.decrease-item', (e) => {
    addToCart(e, true, false);
  });

  $(document).on('click', '.cart-increase-item', (e) => {
    addToCart(e, true, true, true);
  });

  $(document).on('click', '.cart-decrease-item', (e) => {
    addToCart(e, true, false, true);
  });

  class VoucherPostData {
    constructor(productId, orderItemId, quantity) {
      this.order_id = orderId ? orderId : undefined;
      this.product_id = productId ? productId : undefined;
      this.order_item_id = orderItemId ? orderItemId : undefined;
      this.quantity = quantity;
    }
  }

  class OrderItem {
    constructor(orderItem) {
      this.orderItemId = orderItem.order_item_id;
      this.quantity = orderItem.quantity;
      this.productId = orderItem.product_id;
      this.unitPrice = orderItem.unit_price;
      this.totalPrice = orderItem.total_price;
    }
  }

  function completeVoucherCheckout(data) {
    $.ajax({
      //dataType: 'json',
      method: 'POST',
      url: checkoutUrl,
      beforeSend: function () {
        loaderStart();
      },
      complete: function () {
        loaderStop();
      },
      data: JSON.stringify(data),
      headers: getHeaders(),
      success() {
        showEmptyCart();
        toastr.success('Order Placed Successfully.');
        $('#cart-count').html(0);
        $('.cart--curtain').removeClass('cart--visible');
        redirectToVouchers();
        destroyCartLocalStorage();
      },
      error() {
        toastr.error('We are unable to process your order now. Please contact 18001086060 for further assistance');
      }
    });
  }

  function destroyCartLocalStorage() {
    localStorage.removeItem('orderId');
    localStorage.removeItem('voucher-proceed-to-checkout');
  }

  function generateRazorpayOrder() {
    let discount = 0;
    if (cartAppliedCoupon) {
      discount += cartCouponsList.get(cartAppliedCoupon).denomination;
    }
    if (cartApplyLoyalty) {
      discount += cartLoyaltyDiscountApplied;
    }
    if (discount === 0) {
      discount = undefined;
    }
    $.ajax({
      dataType: 'json',
      data: {discount},
      beforeSend: function () {
        loaderStart();
      },
      complete: function () {
        loaderStop();
      },
      url: generateRazorpayOrderUrl,
      headers: getHeaders(),
      success(data) {
        proceedToVoucherCheckout(data);
      },
      error(data) {
        toastr.error(data.responseJSON.fieldErrors[0].message);
      }
    });
  }

  $('#proceed-to-checkout').click(() => {
    if (isAnonymous()) {
      $('.button--signin').trigger('click');
      //localStorage.setItem('voucher-proceed-to-checkout', '1');
    } else {
      if (getCartTotal() > 0) {
        generateRazorpayOrder();
      } else {
        let data = {};
        if (cartApplyLoyalty) {
          data.loyalty_points = cartLoyaltyPointsApplied;
        }
        if (cartAppliedCoupon) {
          data.bar_code = cartAppliedCoupon;
        }
        if (data) {
          completeVoucherCheckout(data);
        }
      }
    }
  });

  function loaderStop() {
    $('.fakeLoader').removeClass('display-block');
    $('.fakeLoader').addClass('hide');
  }

  function loaderStart() {
    $('.fakeLoader').removeClass('hide');
    $('.fakeLoader').addClass('display-block');
  }

  function proceedToVoucherCheckout(data) {
    const options = {
      key: data.key,
      order_id: data.order_id,
      amount: data.amount,
      currency: data.currency,
      name: 'Barbeque Nation',
      image: '/themes/custom/bbq_nation/assets/images/bbqn-logo.svg',
      handler: ((transaction) => {
        const cartElement = $('#cart-curtain');
        if (cartElement.hasClass('cart--visible')) {
          cartElement.removeClass('cart--visible');
        }
        if (cartApplyLoyalty) {
          transaction.loyalty_points = cartLoyaltyPointsApplied;
        }
        if (cartAppliedCoupon) {
          transaction.bar_code = cartAppliedCoupon;
        }
        completeVoucherCheckout(transaction);
      }),
    };
    window.rzpay = new Razorpay(options);
    rzpay.open();
  }

  // Voucher listing starts here.
  $(() => {
    if (!isAnonymous()) {
      //const toCheckout = parseInt(localStorage.getItem('voucher-proceed-to-checkout'), 10);
      destroyCartLocalStorage();
      // if (toCheckout === 1) {
      //   getCart();
      //   $('.cart--curtain').addClass('cart--visible');
      //   generateRazorpayOrder();
      // }
    }
    if (isVoucherPage() || isPromotionPage()) {
      buildIdQuery(1);
      getListingPage(false, true);
    }
    if (isHomePage() || isVoucherDetailPage()) {
      if (isHomePage()) {
        const observerConfig = {
          childList: true,
        };
        const voucherBlock = document.getElementById('homepage-gift-vouchers');
        const observer = new MutationObserver(() => {
          setInitialQuantity();
          observer.disconnect();
        });
        observer.observe(voucherBlock, observerConfig);
      } else {
        setInitialQuantity();
      }
    }
  });

  $(document).on('click', '.logout', () => {
    destroyCartLocalStorage();
  });

  function enableFilterClearAllButton() {
    $('#clear-all-voucher-filters').show();
  }

  function disableFilterClearAllButton() {
    $('#clear-all-voucher-filters').hide();
  }

  function buildMultiOrSingleMatchQuery(ids, key) {
    voucherFilterObject.page = 0;
    const singleKey = `${key}.equals`;
    const multiKey = `${key}.in`;
    if (ids) {
      if (key === 'countryId' && ids === '0' && voucherFilterObject[singleKey]) {
        delete voucherFilterObject[singleKey];
      } else if (key === 'countryId') {
        voucherFilterObject[singleKey] = ids;
      } else if (voucherFilterObject[singleKey] === ids) {
        delete voucherFilterObject[singleKey];
      } else if (voucherFilterObject[multiKey] && voucherFilterObject[multiKey].includes(ids)) {
        const index = voucherFilterObject[multiKey].indexOf(ids);
        if (index > -1) {
          voucherFilterObject[multiKey].splice(index, 1);
        }
        if (voucherFilterObject[multiKey].length === 1) {
          const value = voucherFilterObject[multiKey][0];
          delete voucherFilterObject[multiKey];
          voucherFilterObject[singleKey] = value;
        }
      } else if (voucherFilterObject[singleKey]) {
        delete Object.assign(voucherFilterObject, {
          [multiKey]: voucherFilterObject[singleKey]
        })[singleKey];
        voucherFilterObject[multiKey] = [voucherFilterObject[multiKey]];
        voucherFilterObject[multiKey].push(ids);
      } else if (voucherFilterObject[multiKey]) {
        voucherFilterObject[multiKey].push(ids);
      } else if (!Array.isArray(ids)) {
        voucherFilterObject[singleKey] = ids;
      } else if (ids.length > 1) {
        voucherFilterObject[multiKey].push(ids.join());
      } else {
        voucherFilterObject[singleKey] = ids.join();
      }
    }
  }

  function buildPriceQuery(minPrice, maxPrice) {
    voucherFilterObject.page = 0;
    if (minPrice) {
      voucherFilterObject['price.greaterThanOrEqual'] = minPrice;
    }
    if (maxPrice) {
      voucherFilterObject['price.lessThanOrEqual'] = maxPrice;
    }
  }

  function buildIdQuery(countries, cities, branches) {
    buildMultiOrSingleMatchQuery(countries, 'countryId');
    buildMultiOrSingleMatchQuery(cities, 'cityId');
    buildMultiOrSingleMatchQuery(branches, 'branchId');
  }

  function buildAdditionFilterQuery(treatTypes, foodClassifications, dayOfWeeks, voucherTypes) {
    buildMultiOrSingleMatchQuery(treatTypes, 'treatType');
    buildMultiOrSingleMatchQuery(foodClassifications, 'foodClassification');
    buildMultiOrSingleMatchQuery(dayOfWeeks, 'weekDays');
    buildMultiOrSingleMatchQuery(voucherTypes, 'voucherType');
  }

  function getCountryFilterList() {
    let countryOptions = '';
    countryOptions += '<option value="0">Select a country</option>';
    voucherFilters.countries.forEach((country) => {
      if (voucherFilterObject['countryId.equals'] && voucherFilterObject['countryId.equals'] === country.country_id) {
        countryOptions += `<option value=${country.country_id} selected>${country.country_name}</option>`;
      } else {
        countryOptions += `<option value=${country.country_id}>${country.country_name}</option>`;
      }
    });
    return countryOptions;
  }

  function getCityHtml() {
    `<div class="form-item__checkbox">
     <input id="city-${city.city_id}" type="checkbox" name="city" value="${city.city_id}" checked>
     <label for="city-${city.city_id}">${city.city_name}</label>
  </div>`
  }

  function getCityFilterList() {
    let cityList = '';
    voucherFilters.cities.forEach((city) => {
      if ((voucherFilterObject['cityId.in'] && voucherFilterObject['cityId.in'].includes(city.city_id)) || (voucherFilterObject['cityId.equals'] && voucherFilterObject['cityId.equals'] === city.city_id)) {
        cityList += `<div class="form-item__checkbox">
                     <input id="city-${city.city_id}" type="checkbox" name="city" value="${city.city_id}" checked>
                     <label for="city-${city.city_id}">${city.city_name}</label>
                  </div>`;
      } else {
        cityList += `<div class="form-item__checkbox">
                     <input id="city-${city.city_id}" type="checkbox" name="city" value="${city.city_id}">
                     <label for="city-${city.city_id}">${city.city_name}</label>
                  </div>`;
      }
    });
    return cityList;
  }

  function getBranchFilterList() {
    let branchList = '';
    voucherFilters.branches.forEach((branch) => {
      if ((voucherFilterObject['branchId.in'] && voucherFilterObject['branchId.in'].includes(branch.branch_id)) || (voucherFilterObject['branchId.equals'] && voucherFilterObject['branchId.equals'] === branch.branch_id)) {
        branchList += `<div class="form-item__checkbox">
                        <input id="branch-${branch.branch_id}" type="checkbox" name="branch" value="${branch.branch_id}" checked>
                        <label for="branch-${branch.branch_id}">${branch.branch_name}</label>
                    </div>`;
      } else {
        branchList += `<div class="form-item__checkbox">
                        <input id="branch-${branch.branch_id}" type="checkbox" name="branch" value="${branch.branch_id}">
                        <label for="branch-${branch.branch_id}">${branch.branch_name}</label>
                    </div>`;
      }
    });
    return branchList;
  }

  function getAdditionFilterList(additionFilters, type) {
    let additionFilterList = '';
    additionFilters.forEach((filter) => {
      if ((voucherFilterObject[`${type}.in`] && voucherFilterObject[`${type}.in`].includes(filter)) || (voucherFilterObject[`${type}.equals`] && voucherFilterObject[`${type}.equals`] === filter)) {
        additionFilterList += `<div class="form-item__checkbox">
                                <input id="${type}-${filter}" type="checkbox" name=${type} value="${filter}" checked>
                                <label for="${type}-${filter}">${filter}</label>
                             </div>`;
      } else {
        additionFilterList += `<div class="form-item__checkbox">
                                <input id="${type}-${filter}" type="checkbox" name=${type} value="${filter}">
                                <label for="${type}-${filter}">${filter}</label>
                             </div>`;
      }
    });
    return additionFilterList;
  }

  function getWeekDayList() {
    let weekDayList = '';
    voucherFilters.dayOfWeeks.forEach((dayOfWeek) => {
      if ((voucherFilterObject['weekDays.in'] && voucherFilterObject['weekDays.in'].includes(dayOfWeek)) || (voucherFilterObject['weekDays.equals'] && voucherFilterObject['weekDays.equals'] === dayOfWeek)) {
        weekDayList += `<div class="form-item__checkbox">
                        <input id="${dayOfWeek}" type="checkbox" name="dayOfWeek" value="${dayOfWeek}" checked>
                        <label for="${dayOfWeek}">${dayOfWeek}</label>
                      </div>`
      } else {
        weekDayList += `<div class="form-item__checkbox">
                        <input id="${dayOfWeek}" type="checkbox" name="dayOfWeek" value="${dayOfWeek}">
                        <label for="${dayOfWeek}">${dayOfWeek}</label>
                      </div>`
      }
    });
    return weekDayList;
  }

  function buildVoucherCard(voucher) {
    return `<article id="${voucher.voucher_id}" class="card card--voucher">
            <div class="card__media">
                <img src="${voucher.voucher_banner}" alt="Voucher">
            </div>
            <div class="card__header">
                <div class="unit">${voucher.voucher_name}</div>
                <div class="price">${getCurrencyCode(voucher.currency_code)}${voucher.price.toLocaleString("en")}</div>
            </div>
            <div class="card__footer">
              <div class="atc">
                <a id="add-to-cart-${voucher.voucher_id}" class="button button--atc">Add to Cart</a>
                <div class="card__footer__form-wrap">
                    <div class="form form--atc">
                      <div class="value-button decrease-item">-</div>
                      <input type="text" class="voucher-quantity-${voucher.voucher_id} number" value="0" readonly/>
                      <div class="value-button increase-item">+</div>
                    </div>
                </div>
              </div>
              <div class="info">
                <a href="#" class="open-dialog">More info <span class="viewMore"></span></a>
              </div>
            </div>
           </article>`;
  }

  function buildPromotionCard(promotion) {
    return `<article id="${promotion.promotion_id}" class="promotion-card">
            <div class="events--card" onclick = "window.location = '${promotion.promotion_url}'" >
            <div class="events--card-details">
              ${getDescriptionHtml(promotion.title, 'events--card-details--title')}
              ${getDescriptionHtml(promotion.teaser_text_one, 'events--card-details--bottom')}
              ${getDescriptionHtml(promotion.teaser_text_two, 'events--card-details--description')}
            <div class="events--card-details--link">
            <a href="${promotion.promotion_url}" title="">
                More info
                <span class="viewMore"></span>
            </a>
            </div>
            </div>
            <div class="events--card-image">
            <img src="${promotion.teaser_banner}" alt="Voucher">
            </div>
            </div>
           </article>`;
  }

  function getDescriptionHtml(text, className) {
    if (text) {
      return `<div class="${className}">
                ${text}
              </div>`
    } else {
      return '';
    }
  }

  function disableOrEnablePrice() {
    if (filterMinPriceSlider === filterMaxPriceSlider) {
      $('#price-filter').closest('s-voucher__filter-elem-wrap').hide();
    } else {
      const priceElement = $('#price-filter');
      if (priceElement.is(':hidden')) {
        priceElement.show();
      }
    }
  }

  function convertFilterObjectArrayValues() {
    const requestFilterObject = {};
    if (voucherFilterObject['price.greaterThanOrEqual']) {
      requestFilterObject['price.greaterThanOrEqual'] = voucherFilterObject['price.greaterThanOrEqual'];
    }
    if (voucherFilterObject['price.lessThanOrEqual']) {
      requestFilterObject['price.lessThanOrEqual'] = voucherFilterObject['price.lessThanOrEqual'];
    }
    if (voucherFilterObject.sort) {
      requestFilterObject.sort = voucherFilterObject.sort;
    }
    if (voucherFilterObject.size) {
      requestFilterObject.size = voucherFilterObject.size;
    }
    if (voucherFilterObject.page) {
      requestFilterObject.page = voucherFilterObject.page;
    }
    if (voucherFilterObject['countryId.in']) {
      requestFilterObject['countryId.in'] = voucherFilterObject['countryId.in'].join();
    }
    if (voucherFilterObject['countryId.equals']) {
      requestFilterObject['countryId.equals'] = voucherFilterObject['countryId.equals'];
    }
    if (voucherFilterObject['cityId.in']) {
      requestFilterObject['cityId.in'] = voucherFilterObject['cityId.in'].join();
    }
    if (voucherFilterObject['cityId.equals']) {
      requestFilterObject['cityId.equals'] = voucherFilterObject['cityId.equals'];
    }
    if (voucherFilterObject['branchId.in']) {
      requestFilterObject['branchId.in'] = voucherFilterObject['branchId.in'].join();
    }
    if (voucherFilterObject['branchId.equals']) {
      requestFilterObject['branchId.equals'] = voucherFilterObject['branchId.equals'];
    }
    if (voucherFilterObject['treatType.in']) {
      requestFilterObject['treatType.in'] = voucherFilterObject['treatType.in'].join();
    }
    if (voucherFilterObject['treatType.equals']) {
      requestFilterObject['treatType.equals'] = voucherFilterObject['treatType.equals'];
    }
    if (voucherFilterObject['foodClassification.in']) {
      requestFilterObject['foodClassification.in'] = voucherFilterObject['foodClassification.in'].join();
    }
    if (voucherFilterObject['foodClassification.equals']) {
      requestFilterObject['foodClassification.equals'] = voucherFilterObject['foodClassification.equals'];
    }
    if (voucherFilterObject['weekDays.in']) {
      requestFilterObject['weekDays.in'] = voucherFilterObject['weekDays.in'].join();
    }
    if (voucherFilterObject['weekDays.equals']) {
      requestFilterObject['weekDays.equals'] = voucherFilterObject['weekDays.equals'];
    }
    if (voucherFilterObject['voucherType.in']) {
      requestFilterObject['voucherType.in'] = voucherFilterObject['voucherType.in'].join();
    }
    if (voucherFilterObject['voucherType.equals']) {
      requestFilterObject['voucherType.equals'] = voucherFilterObject['voucherType.equals'];
    }
    return requestFilterObject;
  }

  function emptyVoucherListing() {
    $('#voucher-list').empty();
  }

  function disableLoadMore() {
    $('#filter-load-more').hide();
  }

  function enableLoadMore() {
    $('#filter-load-more').show();
  }

  function mergeFilters(newFilters) {
    const newMinPrice = newFilters.minPrice;
    const newMaxPrice = newFilters.maxPrice;
    if (newMinPrice < voucherFilters.minPrice) {
      voucherFilters.minPrice = newMinPrice;
    }
    if (newMaxPrice > voucherFilters.maxPrice) {
      voucherFilters.maxPrice = newMaxPrice;
    }
    if (voucherFilters.countries && newFilters.countries) {
      const countryIds = new Set(voucherFilters.countries.map((country) => country.country_id));
      voucherFilters.countries = [...voucherFilters.countries,
        ...newFilters.countries.filter((country) => !countryIds.has(country.country_id))
      ];
      voucherFilters.countries.sort((a, b) => a.country_name.localeCompare(b.country_name));
    }
    if (voucherFilters.cities && newFilters.cities) {
      const cityIds = new Set(voucherFilters.cities.map((city) => city.city_id));
      voucherFilters.cities = [...voucherFilters.cities,
        ...newFilters.cities.filter((city) => !cityIds.has(city.city_id))
      ];
      voucherFilters.cities.sort((a, b) => a.city_name.localeCompare(b.city_name));
    }
    if (voucherFilters.branches && newFilters.branches) {
      const branchIds = new Set(voucherFilters.branches.map((branch) => branch.branch_id));
      voucherFilters.branches = [...voucherFilters.branches,
        ...newFilters.branches.filter((branch) => !branchIds.has(branch.branch_id))
      ];
      voucherFilters.branches.sort((a, b) => a.branch_name.localeCompare(b.branch_name));
    }
    if (voucherFilters.voucherTypes && newFilters.voucherTypes) {
      voucherFilters.voucherTypes = [...new Set([...voucherFilters.voucherTypes, ...newFilters.voucherTypes])];
      voucherFilters.voucherTypes.sort();
    }
    if (voucherFilters.foodClassifications && newFilters.foodClassifications) {
      voucherFilters.foodClassifications = [...new Set([...voucherFilters.foodClassifications,
        ...newFilters.foodClassifications
      ])];
      voucherFilters.foodClassifications.sort();
    }
    if (voucherFilters.treatTypes && newFilters.treatTypes) {
      voucherFilters.treatTypes = [...new Set([...voucherFilters.treatTypes, ...newFilters.treatTypes])];
      voucherFilters.treatTypes.sort();
    }
    if (voucherFilters.dayOfWeeks && newFilters.dayOfWeeks) {
      voucherFilters.dayOfWeeks = [...new Set([...voucherFilters.dayOfWeeks, ...newFilters.dayOfWeeks])];
    }
  }

  function buildFilter(filterData, updateStatus) {
    if (updateStatus) {
      mergeFilters(filterData);
    } else {
      voucherFilters = new VoucherFilter(filterData);
    }
    if (!filterMinPriceSlider) {
      filterMinPriceSlider = voucherFilters.minPrice;
    }
    if (!filterMaxPriceSlider) {
      filterMaxPriceSlider = voucherFilters.maxPrice;
    }
    if (!filterSelectedMinPrice) {
      filterSelectedMinPrice = voucherFilters.minPrice;
    }
    if (!filterSelectedMaxPrice) {
      filterSelectedMaxPrice = voucherFilters.maxPrice;
    }
    const minPrice = $('#amount-min');
    const maxPrice = $('#amount-max');
    $('#price-range').slider({
      range: true,
      min: filterMinPriceSlider,
      max: filterMaxPriceSlider,
      values: [filterSelectedMinPrice, filterSelectedMaxPrice],
      slide(event, ui) {
        minPrice.val(ui.values[0]);
        maxPrice.val(ui.values[1]);
      },
      stop(event, ui) {
        filterSelectedMinPrice = ui.values[0];
        filterSelectedMaxPrice = ui.values[1];
        buildPriceQuery(filterSelectedMinPrice, filterSelectedMaxPrice);
        getListingPage();
      },
    });
    minPrice.val(filterSelectedMinPrice);
    maxPrice.val(filterSelectedMaxPrice);
    disableOrEnablePrice();
    if (voucherFilters.countries.length > 0) {
      $('#country-filter-dropdown').html(getCountryFilterList());
    } else {
      $('#country-filter-dropdown').closest('.s-voucher__filter-elem-wrap').hide();
    }
    if (voucherFilters.cities.length > 0) {
      $('#city-filter-select').html(getCityFilterList());
    } else {
      $('#city-filter-select').closest('.s-voucher__filter-elem-wrap').hide();
    }
    if (voucherFilters.branches.length > 0) {
      $('#branch-filter-select').html(getBranchFilterList());
    } else {
      $('#branch-filter-select').closest('.s-voucher__filter-elem-wrap').hide();
    }
    if (voucherFilters.treatTypes.length > 0) {
      $('#treat-type-select').html(getAdditionFilterList(voucherFilters.treatTypes, 'treatType'));
    } else {
      $('#treat-type-select').closest('.s-voucher__filter-elem-wrap').hide();
    }
    if (voucherFilters.foodClassifications.length > 0) {
      $('#food-classification-select').html(getAdditionFilterList(voucherFilters.foodClassifications, 'foodClassification'));
    } else {
      $('#food-classification-select').closest('.s-voucher__filter-elem-wrap').hide();
    }
    if (voucherFilters.dayOfWeeks.length > 0) {
      $('#day-of-the-week-select').html(getWeekDayList());
    } else {
      $('#day-of-the-week-select').closest('.s-voucher__filter-elem-wrap').hide();
    }
    if (voucherFilters.voucherTypes.length > 0) {
      $('#voucher-type-select').html(getAdditionFilterList(voucherFilters.voucherTypes, 'voucherType'));
    } else {
      $('#voucher-type-select').closest('.s-voucher__filter-elem-wrap').hide();
    }
  }

  function buildListing(data, updateStatus) {
    const list = $('#voucher-list');
    if (!updateStatus) {
      list.empty();
    }
    if (isVoucherPage()) {
      data.forEach((voucher) => {
        list.append(buildVoucherCard(voucher));
      });
    } else if (isPromotionPage()) {
      data.forEach((promotion) => {
        list.append(buildPromotionCard(promotion));
      });
    }
  }

  $(document).on('click', '.open-dialog', (e) => {
    $.ajax({
      dataType: 'json',
      beforeSend: function () {
        loaderStart();
      },
      complete: function () {
        loaderStop();
      },
      url: `${voucherDetailUrl}${getVoucherId(e)}`,
      headers: getHeaders(false),
      success(data) {
        $('#dialog').html(voucherInfoHtml(data));
      },
    });
  });

  $(document).on('click', '#close-voucher-dialog', (e) => {
    $('#dialog').children().remove();
    e.preventDefault();
  });

  function voucherInfoHtml(data) {
    return `<div class="overlay-wrapper">
              <div class="voucher-info overlay-content">
                <div class="info__header">
                  <h1>More Details About Voucher</h1>
                  <a href="#" id="close-voucher-dialog" class="close"></a>
                </div>
                <div class="info__content">
                  <div class="info">
                    <h3>Timings</h3>
                    <table id="voucher-detail-timing">${getTimingHtml(data.timings)}</table>
                  </div>
                  <div class="info">
                    <h3>Voucher Description</h3>
                    <div>${data.voucher_description}</div>
                  </div>
                  <div class="info">
                    <h3>Cancellation Policy</h3>
                    <div id="voucher-detail-cancellation-policy">${data.cancellation_policy}</div>
                  </div>
                  <div class="info">
                    <h3>Not valid on</h3>
                    <div class="info__valid-date">
                      <dl id="voucher-detail-not-valid-on">${notValidOnHtml(data.voucher_not_valid_on)}</dl>
                    </div>
                  </div>
                  <div class="info">
                    <h3>Use this within</h3>
                    <div id="voucher-detail-validity">${data.voucher_validity}</div>
                  </div>
                  <div class="info">
                    <h3>Things to remember</h3>
                    <div id="voucher-detail-terms-and-conditions">${data.terms_and_condition}</div>
                  </div>
                </div>
              </div>
        </div>`
  }

  function notValidOnHtml(notValidOn) {
    let notValidOnHtml = '';
    if (notValidOn) {
      notValidOn.forEach((day) => {
        notValidOnHtml += `<dt>${day}</dt>`;
      });
    }
    return notValidOnHtml;
  }

  function getTimingHtml(timings) {
    let timingHtml = '';
    if (timings) {
      timings.forEach((timing) => {
        timingHtml += `<tr>
                    <td>${timing.day}</td>
                    <td>${timing.time}</td>
                   </tr>`
      });
    }
    return timingHtml;
  }

  function getListingPage(updateStatus = false, setQuantity = false) {
    let url;
    if (isVoucherPage()) {
      url = voucherListingUrl;
    } else if (isPromotionPage()) {
      url = promotionListingUrl;
    }
    $.ajax({
      dataType: 'json',
      url,
      beforeSend: function () {
        loaderStart();
      },
      complete: function () {
        loaderStop();
      },
      data: convertFilterObjectArrayValues(),
      headers: {
        'BBQ-Search-Key': 'fca2cd09af45d7872342a882f035a6e3',
      },
      success(vouchers) {
        if (vouchers && vouchers.content && vouchers.content.length > 0) {
          showAllFilters();
          voucherTotalElements = vouchers.total_elements;
          voucherPageNumber = vouchers.page_number;
          voucherPageSize = vouchers.page_size;
          voucherCurrentPageLength = vouchers.content.length;
          if (voucherPageSize * (voucherPageNumber + 1) < voucherTotalElements) {
            enableLoadMore();
          } else {
            disableLoadMore();
          }
          if (voucherFilterObject && Object.keys(voucherFilterObject).length !== 0) {
            enableFilterClearAllButton();
          }
          buildFilter(vouchers.filters, updateStatus);
          buildListing(vouchers.content, updateStatus);
          if (isVoucherPage()) {
            if (setQuantity) {
              setInitialQuantity();
            }
          }
        } else {
          emptyVoucherListing();
          $('#price-filter').closest('.s-voucher__filter-elem-wrap').hide();
          $('#country-filter-dropdown').closest('.s-voucher__filter-elem-wrap').hide();
          $('#city-filter-select').closest('.s-voucher__filter-elem-wrap').hide();
          $('#branch-filter-select').closest('.s-voucher__filter-elem-wrap').hide();
          $('#treat-type-select').closest('.s-voucher__filter-elem-wrap').hide();
          $('#food-classification-select').closest('.s-voucher__filter-elem-wrap').hide();
          $('#day-of-the-week-select').closest('.s-voucher__filter-elem-wrap').hide();
          $('#voucher-type-select').closest('.s-voucher__filter-elem-wrap').hide();
        }
      },
    });
  }

  function showAllFilters() {
    $('#price-filter').closest('.s-voucher__filter-elem-wrap').show();
    $('#country-filter-dropdown').closest('.s-voucher__filter-elem-wrap').show();
    $('#city-filter-select').closest('.s-voucher__filter-elem-wrap').show();
    $('#branch-filter-select').closest('.s-voucher__filter-elem-wrap').show();
    $('#treat-type-select').closest('.s-voucher__filter-elem-wrap').show();
    $('#food-classification-select').closest('.s-voucher__filter-elem-wrap').show();
    $('#day-of-the-week-select').closest('.s-voucher__filter-elem-wrap').show();
    $('#voucher-type-select').closest('.s-voucher__filter-elem-wrap').show();
  }

  function setInitialQuantity() {
    const localOrderId = localStorage.getItem('orderId');
    if (localOrderId && isAnonymous()) {
      orderId = parseInt(localOrderId, 10);
      voucherHttpRequest(voucherCartUrl, 'GET', {order_id: orderId}, true);
    } else if (!isAnonymous()) {
      voucherHttpRequest(voucherCartUrl, 'GET', undefined, true);
    }
  }

  $('#clear-all-voucher-filters').click(() => {
    voucherFilterObject = {};
    if (isPromotionPage()) {
      buildIdQuery('1');
    }
    getListingPage();
    filterSelectedMinPrice = null;
    filterSelectedMaxPrice = null;
    disableFilterClearAllButton();
  });

  $('#country-filter-dropdown').change(() => {
    buildIdQuery(parseInt($('#country-filter-dropdown option:selected').val(), 10));
    getListingPage(false, true);
  });

  $('#city-filter-select').change((e) => {
    buildIdQuery(null, parseInt($(`#${e.target.id}`).val(), 10));
    getListingPage(false, true);
  });

  $('#branch-filter-select').change((e) => {
    buildIdQuery(null, null, parseInt($(`#${e.target.id}`).val(), 10));
    getListingPage(false, true);
  });

  $('#treat-type-select').change((e) => {
    buildAdditionFilterQuery($(`#${e.target.id}`).val());
    getListingPage(false, true);
  });

  $('#food-classification-select').change((e) => {
    buildAdditionFilterQuery(null, $(`#${e.target.id}`).val());
    getListingPage(false, true);
  });

  $('#day-of-the-week-select').change((e) => {
    buildAdditionFilterQuery(null, null, $(`#${e.target.id}`).val());
    getListingPage(false, true);
  });

  $('#voucher-type-select').change((e) => {
    buildAdditionFilterQuery(null, null, null, $(`#${e.target.id}`).val());
    getListingPage(false, true);
  });

  $('#amount-min').focusout((e) => {
    const value = parseInt(e.target.value, 10);
    if (value !== filterSelectedMinPrice) {
      filterSelectedMinPrice = value;
      buildPriceQuery(filterSelectedMinPrice, filterSelectedMaxPrice);
      getListingPage(false, true);
    }
  });

  $('#amount-max').focusout((e) => {
    const value = parseInt(e.target.value, 10);
    if (value !== filterSelectedMaxPrice) {
      filterSelectedMaxPrice = value;
      buildPriceQuery(filterSelectedMinPrice, filterSelectedMaxPrice);
      getListingPage(false, true);
    }
  });

  $('#voucher-filter-sort-dropdown').change(() => {
    const sort = parseInt($('#voucher-filter-sort-dropdown option:selected').val(), 10);
    if (sort === 1) {
      if (voucherFilterObject.page) {
        voucherFilterObject.page = null;
      }
      voucherFilterObject.sort = 'price';
      getListingPage(false, true);
    } else if (sort === 2) {
      if (voucherFilterObject.page) {
        voucherFilterObject.page = null;
      }
      voucherFilterObject.sort = 'price,desc';
      getListingPage(false, true);
    } else if (sort === 0) {
      if (voucherFilterObject.page) {
        voucherFilterObject.page = null;
      }
      voucherFilterObject.sort = undefined;
      getListingPage(false, true);
    }
  });

  $(document).on('click', '.read-more-coupon-description', (e) => {
    e.preventDefault();
    $.dialog({
      title: 'Description',
      boxWidth: '30%',
      useBootstrap: false,
      content: $(e.currentTarget).attr('value'),
    });
  });

  $('#filter-load-more-button').click(() => {
    voucherFilterObject.page = voucherPageNumber + 1;
    getListingPage(true, true);
  });

  class VoucherFilter {
    constructor(filter) {
      this.countries = filter.countries;
      this.cities = filter.cities;
      this.branches = filter.branches;
      this.voucherTypes = filter.voucher_types;
      this.foodClassifications = filter.food_classifications;
      this.treatTypes = filter.treat_types;
      this.dayOfWeeks = filter.day_of_weeks;
      this.minPrice = filter.min_price;
      this.maxPrice = filter.max_price;
    }
  }

  // Voucher listing ends here.
})(jQuery, Drupal);

function getCurrencyCode(currency) {
  if (currency === 'INR') {
    return '&#8377;'
  }
  return '&#8377;'
}

function isAnonymous() {
  return !userId || userId === 0;
}

function getHeaders() {
  if (isAnonymous()) {
    return getAnonymousHeaders();
  } else {
    return {'Content-Type': 'application/json'};
  }
}

function getAnonymousHeaders() {
  return {'BBQ-Client-Id': clientId, 'BBQ-Client-Secret': clientSecret, 'Content-Type': 'application/json'};
}

function getCouponDescription(text) {
  if (text && text.length > 60) {
    return `<div class="coupon-description">${text.substring(0, 60)}...</div>
              <div class="coupon-link">
                <a class="read-more-coupon-description" href="#" value="${text}">Read More</a>
              </div>`;
  } else {
    return `<div class="coupon-description">${text}</div>`;
  }
}
