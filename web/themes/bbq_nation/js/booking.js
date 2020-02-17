const getNearbyBranches = '/api/v1/slots';
const getAllBranches = '/api/v1/get-all-nearby-branches';
const buffetListUrl = '/api/v1/menu-branch-buffet';
const menuListUrl = '/api/v1/menu-branch';
const verifyCorporateUrl = '/api/v1/verify-corporates';
const verifyEmailOtpUrl = '/api/v1/verifyotp';
const createBookingUrl = '/api/v1/bookings';
const createBookingRazorpayOrderUrl = '/api/v1/bookings/generate-rp-order';
const getOccasionJoinedByUrl = '/api/v1/get-occasion-joined-by-master';
const updateOccasionJoinedBySpecialInstructionsUrl = '/api/v1/bookings/special-instructions';
const getCorporateOffersUrl = '/api/v1/corporate-vouchers';
const getLoyaltyExchangeRateUrl = '/api/v1/loyalty-points-value';
const googleMapsUrl = 'http://maps.google.com/maps?daddr=';
const bookingRescheduleUrl = '/api/v1/bookings/reschedule';
const voucherCouponBaseUrl = '/api/v1/vouchers?transaction_type=BOOKING&voucher_type=';

const voucherTypeConstant = 'GV';
const couponTypeConstant = 'GC';

const userVouchersUrl = voucherCouponBaseUrl + voucherTypeConstant;
const userCouponsUrl = voucherCouponBaseUrl + couponTypeConstant;

let preferredBranch;
let branchList = [];

const singleBranchConstant = 'SINGLE_BRANCH';
const allBranchesConstant = 'ALL_BRANCHES';
const buffetConstant = 'BUFFET';
const menuConstant = 'MENU';
const branchMenuConstant = 'BRANCH_MENU';
const corporateVerificationConstant = 'VERIFY_CORPORATE';
const corporateEmailOtpVerificationConstant = 'VALIDATE_CORPORATE_EMAIL_OTP';
const showVouchersConstant = 'SHOW_VOUCHERS_CONSTANT';
const showCouponsConstant = 'SHOW_COUPONS_CONSTANT';
const createBookingConstant = 'CREAT_BOOKING';
const payAdvanceAmountConstant = 'PAY_ADVANCE';
const updateBookingConstant = 'UPDATE_BOOKING';
const completeBookingConstant = 'COMPLETE_BOOKING';
const getOccasionJoinedByConstant = 'OCCASION_JOINED_BY_CONSTANT';
const updateSpecialInstructionsConstant = 'UPDATE_SPECIAL_INSTRUCTIONS_CONSTANT';
const verifyCouponConstant = 'VERIFY_COUPON_CONSTANT';
const corporateOffersConstant = 'GET_CORPORATE_OFFERS';
const getLoyaltyExchangeRateUrlConstant = 'GET_LOYALTY_EXCHANGE_RATE';

let isCorporatePageActive = false;

let loyaltyPointsApplied;
let loyaltyDiscountApplied;
let applyLoyaltyPoints = false;
let loyaltyPoints;
let loyaltyExchangeRate;

let selectedBranchId;
let selectedDiningType;
let selectedSlotId;
let selectedSlotName;
const todayDate = moment();
const tomorrowDate = moment().add(1, 'days');
let selectedReservationDate = todayDate;
let menuList;
let buffetList;
let menuId;
let bookingList = new Map();
let buffetCurrency;
let corporateEmail;
let corporateOtpId;
let corporateVerified = false;

let corporateCouponList = new Map();
let couponList = new Map();
let voucherList = new Map();

let appliedCorporateCoupon;
let appliedCoupon;
let appliedVouchers = [];

let populateNearbyBranches;


let specialInstructionsBuilt = false;

let bookingId;
let billAmount;
let currency;
let advanceAmount;
let selectedReservationTime;

let subTotal;

let voucherDiscountApplied;
let couponDiscountApplied;

let totalTaxAndServiceAmount;

let rescheduledBookingId;
let rescheduledBranchId;

let bookingData;

(function ($, Drupal) {
  Drupal.behaviors.bbqBooking = {
    attach: function (context, settings) {
      userId = settings.user.uid;
    }
  };

  class CreateBooking {
    constructor() {
      this.booking_id = rescheduledBookingId;
      this.branch_id = selectedBranchId;
      this.slot_id = selectedSlotId;
      this.reservation_time = selectedReservationTime;
      //this.corporate_booking = corporateVerified ? corporateVerified : undefined;
      this.reservation_date = getFormattedReservationDate(selectedReservationDate);
      this.booking_details = Array.from(bookingList.values());
      this.voucher_details = getVoucherDetails();
      this.loyalty_points = applyLoyaltyPoints ? Math.round(loyaltyPointsApplied) : undefined;
      this.reservation_type_id = 4;
    }
  }

  function getVoucherDetails() {
    let vouchers = [];
    if (appliedVouchers && appliedVouchers.length > 0) {
      vouchers = appliedVouchers.map((voucher) => {
        return new BookingVoucher(voucher);
      });
    }
    if (appliedCoupon) {
      vouchers.push(new BookingVoucher(appliedCoupon));
    } else if (appliedCorporateCoupon) {
      vouchers.push(new BookingVoucher(appliedCorporateCoupon));
    }
    if (vouchers.length > 0) {
      return vouchers;
    }
    return undefined;
  }

  class BookingVoucher {
    constructor(voucher) {
      this.title = voucher.title;
      this.voucher_code = voucher.barCode;
      this.voucher_type = voucher.voucherType;
      this.amount = voucher.denomination;
    }
  }

  class CurrentBooking {
    constructor(buffetId, quantity, total) {
      this.menu_id = menuId;
      this.buffet_id = buffetId;
      this.packs = quantity;
      this.total = total;
    }
  }

  class Buffet {
    constructor(data) {
      this.buffetTitle = data.buffet_title;
      this.buffetDescription = data.buffet_description;
      this.buffetData = data.buffet_data ? data.buffet_data.map((buffetData) => {
        return new BuffetData(buffetData)
      }) : [];
    }
  }

  class BuffetData {
    constructor(buffetData) {
      this.buffetId = buffetData.buffet_id;
      this.buffetName = buffetData.buffet_name;
      this.buffetDescription = buffetData.buffet_description;
      this.buffetPrice = buffetData.buffet_price;
      this.buffetCurrency = buffetData.buffet_currency;
      this.buffetType = buffetData.buffet_type;
      this.buffetImage = buffetData.buffet_image;
      this.buffetItems = buffetData.buffet_items ? buffetData.buffet_items.map((buffetItem) => {
        return new BuffetItem(buffetItem)
      }) : [];
    }
  }

  class BuffetItem {
    constructor(buffetItem) {
      this.name = buffetItem.name;
      this.menuItems = buffetItem.menu_items ? buffetItem.menu_items.map((item) => {
        return new MenuItem(item)
      }) : [];
    }
  }

  class MenuItem {
    constructor(menuItem) {
      this.id = menuItem.id;
      this.name = menuItem.name;
      this.tags = menuItem.tags;
      this.type = menuItem.type;
      this.image = menuItem.image;
      this.category = menuItem.category;
      this.posCode = menuItem.pos_code;
      this.description = menuItem.description;
      this.defaultPrice = menuItem.default_price;
      this.saleTypeAlaCarte = menuItem.sale_type_ala_carte;
    }
  }

  class SlotPostData {
    constructor(date) {
      this.reservation_date = date;
      this.branch_id = selectedBranchId ? selectedBranchId : undefined;
      this.dining_type = selectedDiningType ? selectedDiningType : undefined;
    }
  }

  class MenuPostData {
    constructor() {
      this.reservation_date = getFormattedReservationDate(selectedReservationDate);
      this.branch_id = selectedBranchId;
      this.slot_id = selectedSlotId;
      this.reservation_time = selectedReservationTime;
    }
  }

  class PreferredBranch {
    constructor(data) {
      this.branchId = data.branch_id;
      this.branchName = data.branch_name;
      this.amenities = data.amenities ? data.amenities.map((amenity) => {
        return new Amenity(amenity)
      }) : [];
      this.branchImages = data.branch_images;
      this.slotsAvailabe = data.slots_available ? data.slots_available.map((slot) => {
        if (slot && slot.slot_start_time && slot.slot_start_time.length > 0) {
          return new Slot(slot);
        }
      }) : [];
      this.taxDetails = data.taxes.map((tax) => {
        return new TaxDetails(tax)
      });
      this.serviceCharge = data.service_charge;
      this.terms = data.terms;
    }
  }

  class TaxDetails {
    constructor(tax) {
      this.tax = tax.tax;
      this.taxPercentage = tax.tax_percentage;
    }
  }

  class Amenity {
    constructor(amenity) {
      this.name = amenity.name;
      this.description = amenity.description;
      this.image = amenity.image;
    }
  }

  class Slot {
    constructor(slot) {
      this.slotId = slot.slot_id;
      this.slotDesc = slot.slot_desc;
      this.diningType = slot.dining_type;
      this.slotStartTime = getFormattedSlotTime(slot.slot_start_time);
      this.slotReservationTime = slot.slot_start_time;
      this.slotStopTime = slot.slot_stop_time;
      this.totalCapacity = slot.total_capacity;
      this.availableCapacity = slot.available_capacity;
    }
  }

  class BranchList {
    constructor(branch) {
      this.branchId = branch.branch_id;
      this.branchName = branch.branch_name;
    }
  }

  class EmailOtpVerification {
    constructor(email, otpId, otp) {
      this.email = email;
      this.otp_id = otpId;
      this.otp = otp;
    }
  }

  class AppliedCoupon {
    constructor(code, type, denomination) {
      this.voucher_code = code;
      this.voucher_type = type.trim();
      this.amount = denomination;
    }
  }

  class Voucher {
    constructor(voucher) {
      this.barCode = voucher.bar_code;
      this.currency = voucher.currency;
      this.denomination = voucher.denomination;
      this.source = voucher.source;
      this.status = voucher.status;
      this.title = voucher.title;
      this.voucherType = voucher.voucher_type;
      this.image = voucher.image;
      this.applicability = voucher.applicability;
      this.description = voucher.description;
    }
  }

  $.fakeLoader({
    spinner: 'spinner6',
    bgColor: 'rgba(0, 0, 0, 0.5)'
  });

  $('.slot-dropdown').select2();

  $('.branch-dropdown').select2();

  function isProfilePage() {
    return window.location.pathname.indexOf("profile") !== -1;
  }

  function setRescheduledData() {
    selectedBranchId = rescheduledBranchId;
    getBranchList();
    $('.booking-datepicker').datepicker('setDate', getDatePickerFormattedDate(selectedReservationDate));
    updateBookingInformation(getFormattedReservationDate(selectedReservationDate));
  }

  $(() => {
    $('#menu-tab').tabs();
    if (!isProfilePage()) {
      disableReserveButton();
      const branchIdInput = $('#branch-id');
      if (branchIdInput) {
        const branchId = branchIdInput.val();
        if (branchId && branchId.length > 0) {
          const branchMenuTab = $('#branch-menu-tab');
          if (branchMenuTab.length > 0) {
            branchMenuTab.tabs();
          }
          selectedBranchId = branchId;
          populateNearbyBranches = true;
          bookingHttpRequest(buffetListUrl, 'POST', {
            reservation_date: getFormattedReservationDate(todayDate),
            branch_id: selectedBranchId
          }, branchMenuConstant);
        }
      }
      if (checkLocalStorageDetails()) {
        const isUserIdDefined = setInterval(() => {
          if (userId !== 'undefined') {
            clearInterval(isUserIdDefined);
            if (userId && parseInt(userId, 10) !== 0) {
              populateBranchList(branchList);
              populateBranches(preferredBranch, true);
              $('.reservation--curtain').addClass('reservation--visible');
              setBranchDateAndSlot();
              setDiningType();
              setTodayTomorrowCheckBox();
            } else {
              getNearbyByOrBranchList();
            }
          }
        }, 100);
      } else {
        getNearbyByOrBranchList();
      }
    } else {
      const observerConfig = {
        attributes: true
      };
      const bookingRescheduleBlock = document.getElementById('rescheduled-booking-id');
      const observer = new MutationObserver(() => {
        setRescheduledData();
        observer.disconnect();
      });
      observer.observe(bookingRescheduleBlock, observerConfig);
    }
  });

  function updateBranchId() {
    selectedBranchId = $('#bbq-branch-id').val();
    getNearbyByBranches();
  }

  function getNearbyByOrBranchList() {
    getBranchList();
  }

  function populateMenuList(data, isBranch = false) {
    const buffets = data.buffets.buffet_data;
    const alaCarte = data.menu_data;
    const beverages = data.beverage_data;
    let buffetHtml = '';
    let alaCarteHtml = '';
    let beveragesHtml = '';

    let menuItems;
    let menuTabOne;
    let menuTabTwo;
    let menuTabThree;
    let buffetMenu;
    let alaCarteMenu;
    let beveragesMenu;
    if (isBranch) {
      menuItems = $('#target_menu');
      menuTabOne = $('#branch-menu-tab-1-main');
      menuTabTwo = $('#branch-menu-tab-2-main');
      menuTabThree = $('#branch-menu-tab-3-main');
      buffetMenu = $('#branch-buffet-menu');
      alaCarteMenu = $('#branch-a-la-carte-menu');
      beveragesMenu = $('#branch-beverages-menu');
    } else {
      menuItems = $('#booking-menu-items');
      menuTabOne = $('#menu-tab-1-main');
      menuTabTwo = $('#menu-tab-2-main');
      menuTabThree = $('#menu-tab-3-main');
      buffetMenu = $('#buffet-menu');
      alaCarteMenu = $('#a-la-carte-menu');
      beveragesMenu = $('#beverages-menu');
    }
    if (!buffets && !alaCarte && !beverages) {
      menuItems.hide();
    } else {
      menuItems.show();
    }
    if (buffets && buffets.length > 0) {
      menuTabOne.show();
      buffets.forEach((buffet) => {
        buffetHtml += buildBuffetMenuHtml(buffet);
      });
      buffetMenu.html(buffetHtml);
    } else {
      menuTabOne.hide();
    }
    if (alaCarte && alaCarte.length > 0) {
      menuTabTwo.show();
      alaCarte.forEach((item) => {
        alaCarteHtml += buildOtherMenu(item);
      });
      alaCarteMenu.html(alaCarteHtml);
    } else {
      menuTabTwo.hide();
    }
    if (beverages && beverages.length > 0) {
      menuTabThree.show();
      beverages.forEach((item) => {
        beveragesHtml += buildOtherMenu(item);
      });
      beveragesMenu.html(beveragesHtml);
    } else {
      menuTabThree.hide();
    }
  }

  function populateBuffetList(data) {
    menuId = data.menu_id;
    const apiBuffets = data.buffets;
    buffetList = new Buffet(apiBuffets);
    let buffetHtml = '';
    if (apiBuffets) {
      $('#booking-food-preferences').show();
      buffetList.buffetData.forEach((buffet) => {
        if (!buffetCurrency) {
          currency = buffet.buffetCurrency;
          buffetCurrency = getCurrencyCode(currency);
        }
        buffetHtml += generateBuffetItemHtml(buffet);
      });
      $('#buffet-items').html(buffetHtml);
    } else {
      $('#booking-food-preferences').hide();
    }
  }

  function getBuffetId(event) {
    return parseInt($(event.target).closest('form').attr('id'), 10);
  }

  function showTotalVoucherAndCorporate(status = true) {
    if (status) {
      $('.reservation__sub-total').show();
      $('.reservation__discount').addClass('show');
      $('.reservation__apply-vouchers').show();
      $('.reservation__corporate-offers').show();
      $('.reservation__total').addClass('show');
      $('.reservation__tnc').show();
      $('#booking-reserve-button').css('display', 'block');
      $('#booking-applied-vouchers').show();
    } else {
      $('.reservation__sub-total').hide();
      $('.reservation__discount').removeClass('show');
      $('.reservation__apply-vouchers').hide();
      $('.reservation__corporate-offers').hide();
      $('.reservation__total').removeClass('show');
      $('.reservation__tnc').hide();
      $('#booking-reserve-button').hide();
      $('#booking-applied-vouchers').hide();
    }
  }

  $(document).on('click', '.decrease-buffet-quantity', (e) => {
    updateBooking(e, false);
  });

  $(document).on('click', '.increase-buffet-quantity', (e) => {
    showTotalVoucherAndCorporate();
    updateBooking(e);
  });

  function updateBooking(e, increase = true) {
    if (!increase && (appliedCorporateCoupon || appliedCoupon || (appliedVouchers && appliedVouchers.length > 0))) {
      e.stopPropagation();
      toastr.error('Please remove the applied coupons/vouchers to decrease the quantity');
    } else {
      const buffetId = getBuffetId(e);
      const buffetTotalElement = $(`#booking-buffet-total-${buffetId}`);
      const unitPrice = parseFloat($(`#buffet-unit-price-${buffetId}`).val());
      const quantityElement = $(`.buffet-quantity-${buffetId}`);
      let currentQuantity = parseInt(quantityElement.val(), 10);
      if (increase) {
        if (currentQuantity === 0) {
          buffetTotalElement.show();
        }
        currentQuantity++;
        const buffetTotal = unitPrice * currentQuantity;
        updateBookingDetails(quantityElement, currentQuantity, buffetTotalElement, buffetTotal, increase, buffetId);
      } else {
        if (currentQuantity > 0) {
          currentQuantity--;
        }
        const buffetTotal = unitPrice * currentQuantity;
        if (validateBuffetTotal(buffetId, buffetTotal, currentQuantity)) {
          appliedCoupon = undefined;
          appliedVouchers = [];
          appliedCorporateCoupon = undefined;
          voucherDiscountApplied = undefined;
          couponDiscountApplied = undefined;
          $('#booking-applied-vouchers').empty();
          enableCorporateAndCouponLink();
          setAmountDetails();
          updateBookingDetails(quantityElement, currentQuantity, buffetTotalElement, buffetTotal, increase, buffetId);
        }
      }
    }
  }

  function updateBookingDetails(quantityElement, currentQuantity, buffetTotalElement, buffetTotal, increase, buffetId) {
    quantityElement.val(currentQuantity);
    buffetTotalElement.html(getCurrencyCode(buffetCurrency) + '' + buffetTotal);
    if (currentQuantity > 0) {
      bookingList.set(buffetId, new CurrentBooking(buffetId, currentQuantity, buffetTotal));
    } else if (!increase && currentQuantity === 0) {
      buffetTotalElement.hide();
      if (bookingList.has(buffetId)) {
        bookingList.delete(buffetId);
      }
      if (bookingList.size === 0) {
        showTotalVoucherAndCorporate(false);
      }
    }
    setBuffetTotal();
  }

  function validateBuffetTotal(buffetId, buffetTotal, currentQuantity) {
    if (applyLoyaltyPoints) {
      if (bookingList.size === 1 && currentQuantity === 0) {
        toastr.error('Please remove the applied smiles before reducing the quantity');
        return false;
      }
    }
    return true;
  }

  function setBuffetTotal() {
    subTotal = 0;
    bookingList.forEach((v, k) => {
      subTotal += v.total;
    });
    setAmountDetails();
  }

  function calculateLoyaltyPoints() {
    if (loyaltyPoints && loyaltyPoints > 0 && loyaltyExchangeRate) {
      const applicableLoyaltyPoints = getBookingTotal(true) / loyaltyExchangeRate;
      if (!applicableLoyaltyPoints) {
        applyLoyaltyPoints = false;
      } else if (loyaltyPoints >= applicableLoyaltyPoints) {
        loyaltyPointsApplied = applicableLoyaltyPoints;
      } else {
        loyaltyPointsApplied = loyaltyPoints;
      }
      loyaltyDiscountApplied = loyaltyPointsApplied * loyaltyExchangeRate;
      setLoyaltyPointsHtml();
    } else {
      $('#cart-loyalty-points').empty();
    }
  }

  function setAmountDetails() {
    setSubTotal();
    calculateTaxAmount();
    calculateLoyaltyPoints();
    setBookingTotal();
  }

  function setLoyaltyPointsHtml() {
    let anchorLink;
    let loyaltyText;
    let skipLoyalty = false;
    if (applyLoyaltyPoints) {
      anchorLink = '<a href="#" class="remove-link" id="remove-booking-loyalty-points">Remove</a>';
      loyaltyText = Math.round(loyaltyPointsApplied) + ' BBQN points applied for this transaction';
    } else {
      if (getBookingTotal() > 0) {
        anchorLink = `<a href="#" class="add-link" id="apply-booking-loyalty-points">Add</a>`;
        loyaltyText = buffetCurrency + Math.round(loyaltyDiscountApplied) + ' discount applicable by using ' + Math.round(loyaltyPointsApplied) + ' BBQN points';
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
      if (applyLoyaltyPoints) {
        loyaltyHtml += `<div class="right">- ${buffetCurrency}${Math.round(loyaltyDiscountApplied)}</div>`;
      }
      $('#booking-loyalty-points').html(loyaltyHtml);
    } else {
      $('#booking-loyalty-points').empty();
    }
  }

  $(document).on('click', '#apply-booking-loyalty-points', (e) => {
    applyLoyaltyPoints = true;
    setAmountDetails();
  });

  $(document).on('click', '#remove-booking-loyalty-points', (e) => {
    applyLoyaltyPoints = false;
    setAmountDetails();
  });

  function setSubTotal() {
    $('#booking-sub-total').html(`${buffetCurrency}${getSubTotal().toFixed(2)}`);
  }

  function getSubTotal() {
    let total = subTotal;
    if (couponDiscountApplied) {
      total -= couponDiscountApplied;
    }
    return total;
  }

  function setBookingTotal() {
    $('#booking-total').html(`${buffetCurrency}${getBookingTotal().toFixed(2)}`);
  }

  function getBookingTotal(loyalty = false) {
    let total = getSubTotal() + totalTaxAndServiceAmount;
    if (applyLoyaltyPoints && !loyalty) {
      total -= loyaltyDiscountApplied;
    }
    if (voucherDiscountApplied) {
      total -= voucherDiscountApplied;
    }
    return total < 0 ? 0 : total;
  }

  function populateBranches(data, formatted = false) {
    disableOrEnableReserveButton();
    selectedSlotId = undefined;
    selectedReservationTime = undefined;
    selectedSlotName = undefined;
    if (!$.isEmptyObject(data)) {
      if (!formatted) {
        preferredBranch = new PreferredBranch(data.preferred_branch);
      }
      const branchDropdown = $('.branch-dropdown');
      if (branchDropdown.find(':selected').val() !== preferredBranch.branchId) {
        selectedBranchId = preferredBranch.branchId;
        branchDropdown.val(selectedBranchId).trigger('change');
        //branchDropdown.select2().select2('val', selectedBranchId);
        //branchDropdown.append(`<option value="${preferredBranch.branchId}" selected>${preferredBranch.branchName}</option>`).trigger('change');
      }
      const slotDropdown = $('.slot-dropdown');
      slotDropdown.empty();
      let slotHtml = '';
      preferredBranch.slotsAvailabe.forEach((slot) => {
        if (slot) {
          if (!selectedSlotName) {
            selectedSlotName = slot.slotStartTime;
          }
          if (!selectedSlotId) {
            selectedSlotId = slot.slotId;
            selectedReservationTime = slot.slotReservationTime;
          }
          slotHtml += `<option label="${slot.slotReservationTime}" value="${slot.slotId}">${slot.slotStartTime}</option>`;
        }
      });
      slotDropdown.html(slotHtml);
      $('#selected-reservation-date').text(getFormattedDate(selectedReservationDate));
      $('#booking-slot-value').text(selectedSlotName);
      $('#selected-branch-name').text(preferredBranch.branchName);
      refreshData();
      setBranchImageAndAmenities();
      disableOrEnableReserveButton();
    }
  }

  function setBranchDateAndSlot() {
    $('.branch-dropdown').val(selectedBranchId).trigger('change');
    $('.slot-dropdown').val(selectedSlotId).trigger('change');
    $('.booking-datepicker').datepicker('setDate', getDatePickerFormattedDate(selectedReservationDate));
    //$('.branch-dropdown').select2().select2('val', selectedBranchId);
  }

  $('.booking-datepicker').datepicker({
    dateFormat: 'dd/mm/yy',
    minDate: 0,
    maxDate: moment().add(1, 'M').toDate(),
    onSelect: updateReservationDate
  }).datepicker('setDate', getDatePickerFormattedDate(selectedReservationDate));

  $('#booking-corporate-email-submit').click((e) => {
    sendCorporateOtp();
  });

  $('#booking-resend-corporate-otp').click(() => {
    sendCorporateOtp();
  });

  function sendCorporateOtp() {
    corporateEmail = $('#booking-corporate-email').val();
    bookingHttpRequest(verifyCorporateUrl, 'POST', {'corporate_email': corporateEmail}, corporateVerificationConstant);
  }

  function showCorporateOtpScreen(data, error = false) {
    const emailLabel = $('#booking-corporate-email-label');
    if (error) {
      emailLabel.text('Please enter a valid corporate email id');
      emailLabel.addClass('error-message');
    } else {
      corporateOtpId = data.otp_id;
      emailLabel.hide();
      $('#enter-email').hide();
      $('#verify-otp').show();
    }
  }

  $('#verify-otp-cta').click(() => {
    const otp = $('#booking-corporate-otp').val();
    bookingHttpRequest(verifyEmailOtpUrl, 'POST', new EmailOtpVerification(corporateEmail, corporateOtpId, otp), corporateEmailOtpVerificationConstant);
  });

  function invalidCorporateEmailOtp() {
    const otpLabel = $('#corporate-otp-label');
    otpLabel.text('Please enter a valid otp');
    otpLabel.addClass('error-message');
  }

  function verifyCorporateEmailOtp(data) {
    $('#verify-otp').hide();
    $('#verify-status').show();
    $('#corporate-offer').hide();
    $('.reservation--curtain').removeClass('open-corporate-form');
    //$('.coupon-input').hide();
    //corporateEmail = undefined;
    corporateOtpId = undefined;
    isCorporatePageActive = true;
    const emailLabel = $('#booking-corporate-email-label');
    emailLabel.removeClass('error-message');
    const otpLabelElement = $('#corporate-otp-label');
    otpLabelElement.text('Enter the verification code that sent to your email');
    otpLabelElement.removeClass('error-message');
    $('#booking-corporate-otp').val('');
    corporateVerified = true;
    showOrHideCorporateButtons();
    $('#reservation-info').show();
    // $('#coupons-vouchers').show();
    // $('#coupons-listing').empty();
    // let totalQuantity = 0;
    // bookingList.forEach((v, k) => {
    //   totalQuantity += v.packs;
    // });
    // const corporateData = {
    //   email: corporateEmail,
    //   packs: totalQuantity,
    //   reservation_date: getFormattedReservationDate(selectedReservationDate),
    //   branch_id: selectedBranchId,
    //   slot: selectedSlotId,
    //   amount: getBookingTotal()
    // };
    // bookingHttpRequest(getCorporateOffersUrl, 'POST', corporateData, corporateOffersConstant);
  }

  $('#remove-corporate-offer-button').click((e) => {
    removeCorporateOffer();
    e.stopPropagation();
  });

  function removeCorporateOffer() {
    corporateVerified = false;
    corporateEmail = undefined;
    corporateOtpId = undefined;
    showOrHideCorporateButtons(false);
    $('#enter-email').show().children().show();
    $('#verify-status').hide();
  }

  $('#booking-show-vouchers').click(() => {
    $('#reservation-info').hide();
    $('#coupons-vouchers').show();
    $('#coupons-listing').empty();
    bookingHttpRequest(userVouchersUrl, 'GET', getCouponAndVoucherQueryParam(), showVouchersConstant);
  });

  function getCouponAndVoucherQueryParam() {
    let totalQuantity = 0;
    let total = 0;
    bookingList.forEach((v, k) => {
      totalQuantity += v.packs;
      total += v.total;
    });
    return {
      packs: totalQuantity,
      reservation_date: getFormattedReservationDate(selectedReservationDate),
      branch_id: selectedBranchId,
      slot_id: selectedSlotId,
      amount: total,
      currency: currency
    };
  }

  $('#booking-show-coupons').click((e) => {
    if (appliedCorporateCoupon) {
      toastr.error('You cannot apply coupon with corporate offer applied');
    } else {
      $('#reservation-info').hide();
      $('#coupons-vouchers').show();
      $('#coupons-listing').empty();
      bookingHttpRequest(userCouponsUrl, 'GET', getCouponAndVoucherQueryParam(), showCouponsConstant);
    }
  });

  function populateCouponsAndVouchers(data, type) {
    if (isCorporatePageActive && type === corporateOffersConstant) {
      $('#coupons-listing').empty();
      corporateCouponList = new Map();
      if (data.vouchers && data.vouchers.length > 0) {
        data.vouchers.forEach((coupon) => {
          corporateCouponList.set(coupon.bar_code, new Voucher(coupon));
        });
        buildVoucherAndCouponHtml(type);
      } else {
        $('#coupons-listing').html('<div>No coupons available.</div>');
      }
    } else {
      if (data && data.vouchers && data.vouchers.length > 0) {
        if (type === couponTypeConstant) {
          couponList = new Map();
          data.vouchers.forEach((coupon) => {
            couponList.set(coupon.bar_code, new Voucher(coupon));
          });
          buildVoucherAndCouponHtml(type);
        } else if (type === voucherTypeConstant) {
          voucherList = new Map();
          data.vouchers.forEach((voucher) => {
            voucherList.set(voucher.bar_code, new Voucher(voucher));
          });
          buildVoucherAndCouponHtml(type);
        }
      } else {
        let couponOrVoucherText;
        if (type === couponTypeConstant) {
          couponOrVoucherText = 'coupons';
        } else if (type === voucherTypeConstant) {
          couponOrVoucherText = 'vouchers';
        }
        $('#coupons-listing').html(`<div>No ${couponOrVoucherText} available.</div>`)
      }
    }
  }

  function showOrHideCorporateButtons(status = true) {
    if (status) {
      $('#corporate-offer-applied-badge').show();
      $('#remove-corporate-offer-button').show();
    } else {
      $('#corporate-offer-applied-badge').hide();
      $('#remove-corporate-offer-button').hide();
    }
  }

  function buildVoucherAndCouponHtml(type) {
    let couponHtml = '';
    let voucherAndCoupons;
    let tempSubTotal;
    if (isCorporatePageActive && type === corporateOffersConstant) {
      tempSubTotal = getCouponTotal();
      voucherAndCoupons = corporateCouponList;
    } else if (type === voucherTypeConstant) {
      tempSubTotal = getBookingTotal();
      voucherAndCoupons = voucherList;
    } else if (type === couponTypeConstant) {
      tempSubTotal = getCouponTotal();
      voucherAndCoupons = couponList;
    }
    voucherAndCoupons.forEach((v, k) => {
      const couponItem = voucherAndCouponItemHtml(v.title, v.voucherType, v.barCode, v.currency, v.denomination, tempSubTotal, type, v.applicability, v.description);
      if (couponItem) {
        couponHtml += couponItem;
      }
    });
    $('#coupons-listing').html(couponHtml);
  }

  function getCouponTotal() {
    let tempTotal = getSubTotal() + totalTaxAndServiceAmount;
    if (voucherDiscountApplied) {
      tempTotal -= voucherDiscountApplied;
    }
    if (applyLoyaltyPoints && loyaltyDiscountApplied) {
      tempTotal -= loyaltyDiscountApplied;
    }
    return tempTotal;
  }

  function disableCorporateAndCouponLink() {
    $('.reservation__corporate-link').addClass('anchor-disabled');
    $('#booking-show-coupons').addClass('anchor-disabled');
  }

  function enableCorporateAndCouponLink() {
    $('.reservation__corporate-link').removeClass('anchor-disabled');
    $('#booking-show-coupons').removeClass('anchor-disabled');
  }

  $(document).on('click', '.booking-apply-coupon', (e) => {
    const target = e.target;
    const targetElement = $(target);
    const barCode = target.id;
    let voucherType = targetElement.closest('div').attr('class');
    let voucher;
    let validCoupon = false;
    if (voucherType === voucherTypeConstant) {
      voucher = voucherList.get(barCode);
      appliedVouchers.push(voucher);
    } else if (voucherType === couponTypeConstant) {
      voucher = couponList.get(barCode);
      validCoupon = validateBookingTotal(voucher.denomination, getSubTotal());
      if (validCoupon) {
        disableCorporateAndCouponLink();
        appliedCoupon = voucher;
      }
    } else if (voucherType === corporateOffersConstant) {
      voucher = corporateCouponList.get(barCode);
      validCoupon = validateBookingTotal(voucher.denomination, getSubTotal());
      if (validCoupon) {
        disableCorporateAndCouponLink();
        appliedCorporateCoupon = voucher;
      }
    }
    if (validCoupon || voucherType === voucherTypeConstant) {
      $('#booking-applied-vouchers').append(appliedVoucherHtml(voucher, voucherType));
      buildVoucherAndCouponHtml(voucherType);
    }
  });

  function validateBookingTotal(amount, total) {
    if (amount > total) {
      toastr.error('Please add more items to apply this voucher/coupon');
      return false;
    }
    return true;
  }

  $(document).on('click', '.booking-remove-voucher', (e) => {
    const code = e.target.id;
    appliedVouchers = appliedVouchers.filter(voucher => voucher.barCode !== code);
    voucherDiscountApplied -= voucherList.get(code).denomination;
    setAmountDetails();
    $(`#applied-voucher-${code}`).remove();
  });

  $(document).on('click', '.booking-remove-coupon', (e) => {
    const code = e.target.id;
    appliedCoupon = undefined;
    couponDiscountApplied -= couponList.get(code).denomination;
    setAmountDetails();
    $(`#applied-coupon-${code}`).remove();
    enableCorporateAndCouponLink();
  });

  $(document).on('click', '.booking-remove-corporate-coupon', (e) => {
    const code = e.target.id;
    appliedCorporateCoupon = undefined;
    couponDiscountApplied -= corporateCouponList.get(code).denomination;
    setAmountDetails();
    $(`#applied-coupon-${code}`).remove();
    enableCorporateAndCouponLink();
  });

  $('#booking-reserve-button').click(() => {
    let url;
    let method;
    if (rescheduledBookingId) {
      url = bookingRescheduleUrl;
      method = 'PUT';
    } else {
      url = createBookingUrl;
      method = 'POST';
    }
    bookingHttpRequest(url, method, new CreateBooking(), createBookingConstant);
  });

  $('.reservation__success__advance a').click(function () {
    $('#advance-pay').show();
    $('#advance-amount').val(billAmount);
  });

  $('#advance-amount').click(() => {
    $('#booking-confirmed-pay-advance-amount').prop('disabled', true);
  });

  $('#booking-confirmed-pay-advance-amount').click(() => {
    const confirmedAdvanceAmount = parseFloat($('#advance-amount').val());
    bookingHttpRequest(createBookingRazorpayOrderUrl, 'POST', {
      'booking_id': bookingId,
      'amount': confirmedAdvanceAmount,
      'currency': currency
    }, payAdvanceAmountConstant);
  });

  $('#booking-confirmation-done').click((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProfilePage()) {
      window.location.href = '/profile#reservations';
    } else {
      window.location.reload();
    }
  });

  function showBookingSuccessScreen(data, hidepayment = false) {
    bookingData = data;
    bookingId = data.booking_id;
    billAmount = data.bill_total;
    $('#booking-id').text(bookingId);
    $('#reservation-info').hide();
    $('#reservation__success').show();
    $('#booking-confirmation-buffet-items').html(getBookingConfirmedItemsHtml(data.booking_details));
    if (data.loyalty_points_amount && data.loyalty_points_amount > 0) {
      $('#booking-confirmation-loyalty-points').text(data.loyalty_points_amount.toFixed(2));
    } else {
      $('#booking-confirmation-loyalty-points-block').hide();
    }
    $('#booking-confirmed-bill-total').text(billAmount.toFixed(2).toLocaleString("en"));
    $('#booking-confirmed-branch-name').text(`get together @ ${data.branch_name}`);
    $('#booking-confirmed-reservation-date').html(`<span></span>${getFormattedDate(selectedReservationDate)}`);
    $('#booking-confirmation-navigation').html(`<a class="reservation__success__navigation" href=${googleMapsUrl}${data.lat},${data.long} target="_blank">nav</a>`);
    $('#booking-confirmation-call').html(`<a class="reservation__success__contact" href="tel:${data.branch_contact_no}">call</a>`)
    $('.reservation__success__details').css('background-image', `url(${data.branch_image})`);
    // if (hidepayment) {
    //   $('#advance-pay').hide();
    //   $('#advance-amount-block').hide();
    // }
    $('#advance-pay').hide();
    $('#advance-amount-block').hide();
  }

  $('#booking-confirmation-special-instructions').click(function () {
    $('#special-request').show();
    bookingHttpRequest(getOccasionJoinedByUrl, 'GET', undefined, getOccasionJoinedByConstant);
  });

  $('#request-close').click(function () {
    $('#special-request').hide();
  });

  $('#update-special-instructions').click((e) => {
    const occasion = $('input[name=occasion]:checked').attr('id').substr(9);
    const joinedBy = $('input[name=joined-by]:checked').attr('id').substr(10);
    const specialInstructions = $('#booking-special-instructions').val();
    bookingHttpRequest(updateOccasionJoinedBySpecialInstructionsUrl, 'PUT', {
      'booking_id': bookingId,
      'occasion_id': occasion ? [occasion] : undefined,
      'joined_by': joinedBy ? [joinedBy] : undefined,
      'special_note': specialInstructions ? specialInstructions : undefined
    }, updateSpecialInstructionsConstant);
  });

  function cleanup() {
    showTotalVoucherAndCorporate(false);
    bookingList = new Map();
    appliedCoupon = undefined;
    corporateEmail = undefined;
    corporateVerified = false;
    corporateOtpId = undefined;
    // currency = undefined;
    // billAmount = undefined;
    // bookingId = undefined;
    // couponList = undefined;
    // buffetCurrency = undefined;
    // menuId = undefined;
    // buffetList = undefined;
    // menuList = undefined;
    // selectedReservationDate = undefined;
    // selectedSlotId = undefined;
    // selectedDiningType = undefined;
    // selectedBranchId = undefined;
    // branchList = undefined;
    // preferredBranch = undefined;
    removeCorporateOffer();
    $('#booking-sub-total').html(0);
    $('#booking-tax-details').empty();
    $('#booking-total').html(0);
    $('#booking-applied-vouchers').empty();
    totalTaxAndServiceAmount = undefined;
  }

  function disableOrEnableReserveButton() {
    if (selectedBranchId && selectedBranchId !== 0 && selectedReservationDate && selectedSlotId && selectedSlotId !== 0) {
      enableReserveButton();
    } else {
      disableReserveButton();
    }
  }

  function disableReserveButton() {
    $('#reserve-button').prop('disabled', true);
  }

  function enableReserveButton() {
    $('#reserve-button').prop('disabled', false);
  }

  $('#reserve-button').click((e) => {
    e.stopPropagation();
    e.preventDefault();
    if ($(e.target).hasClass('reservation-button-scroll-top')) {
      $('html, body').animate({scrollTop: 0}, 'swing');
    } else {
      if (userId === 0 || !userId) {
        saveDataInLocalStorage();
        $('.button--signin').trigger('click');
      } else {
        $('.reservation--curtain').addClass('reservation--visible');
        setBranchDateAndSlot();
        getUserLoyaltyPoints();
      }
    }
  });

  function getUserLoyaltyPoints() {
    bookingHttpRequest(getLoyaltyExchangeRateUrl, 'GET', {amount: 1, currency}, getLoyaltyExchangeRateUrlConstant);
  }

  $('.branch-dropdown').on('select2:selecting', (e) => {
    selectedBranchId = e.params.args.data.id;
    if (selectedBranchId !== '0') {
      updateBookingInformation(getFormattedReservationDate(selectedReservationDate));
      disableOrEnableReserveButton();
    } else {
      selectedBranchId = undefined;
      disableOrEnableReserveButton();
    }
  });

  function setBranchImageAndAmenities() {
    $('#branch-background-image').attr('src', preferredBranch.branchImages);
    const amenities = $('.amenity-images');
    let amenitiesHtml = '';
    preferredBranch.amenities.forEach((amenity) => {
      amenitiesHtml += `<div class="amenity-icon">
                        <img src="${amenity.image}" alt="">
                      </div>`
    });
    amenities.html(amenitiesHtml);
  }

  $('.slot-dropdown').on('select2:selecting', (e) => {
    selectedSlotId = parseInt(e.params.args.data.id, 10);
    selectedReservationTime = e.params.args.data.element.label;
    selectedSlotName = e.params.args.data.text;
    $('#booking-slot-value').text(selectedSlotName);
    $('.slot-dropdown').val(selectedSlotId).trigger('change');
    refreshData();
  });

  $('.booking-tomorrow').click(() => {
    $('.booking-datepicker').datepicker('setDate', getDatePickerFormattedDate(tomorrowDate));
    updateReservationDate(tomorrowDate);
  });

  $('.booking-today').click(() => {
    $('.booking-datepicker').datepicker('setDate', getDatePickerFormattedDate(todayDate));
    updateReservationDate(todayDate);
  });

  $('.lunch').click(() => {
    if (selectedDiningType !== 'LUNCH') {
      selectedDiningType = 'LUNCH';
      setDiningType();
      updateBookingInformation(getFormattedReservationDate(selectedReservationDate));
      disableOrEnableReserveButton();
    }
  });

  function setDiningType() {
    if (selectedDiningType === 'LUNCH') {
      $('.lunch').prop('checked', true);
    }
    if (selectedDiningType === 'DINNER') {
      $('.dinner').prop('checked', true);
    }
  }

  $('.dinner').click(() => {
    if (selectedDiningType !== 'DINNER') {
      selectedDiningType = 'DINNER';
      setDiningType();
      updateBookingInformation(getFormattedReservationDate(selectedReservationDate));
      disableOrEnableReserveButton();
    }
  });

  function setTodayTomorrowCheckBox() {
    if (selectedReservationDate.isSame(todayDate)) {
      $('.booking-today').prop('checked', true);
      $('.booking-tomorrow').prop('checked', false);
    } else if (selectedReservationDate.isSame(tomorrowDate)) {
      $('.booking-tomorrow').prop('checked', true);
      $('.booking-today').prop('checked', false);
    } else {
      $('.booking-tomorrow').prop('checked', false);
      $('.booking-today').prop('checked', false);
    }
  }

  function loaderStop() {
    $('.reservation__block').removeClass('disable-click-event');
    $('.fakeLoader').removeClass('display-block');
    $('.fakeLoader').addClass('hide');
  }

  $(document).click((e) => {
    const branchInfoCard = $('.basic-info__form');
    if (!$(e.target).parents('.basic-info__form').length && branchInfoCard.is(':visible')) {
      branchInfoCard.hide();
      $('.basic-info__card').show();
    }
  });

  function loaderStart() {
    $('.reservation__block').addClass('disable-click-event');
    $('.fakeLoader').removeClass('hide');
    $('.fakeLoader').addClass('display-block');
  }

  function bookingHttpRequest(url, requestMethod = 'GET', postData, type, event) {
    $.ajax({
      dataType: 'json',
      method: requestMethod,
      url,
      data: requestMethod !== 'GET' ? JSON.stringify(postData) : postData,
      beforeSend: function () {
        loaderStart();
      },
      complete: function () {
        loaderStop();
      },
      headers: getHeaders(),
      success(data) {
        if (type === singleBranchConstant) {
          populateBranches(data);
        }
        if (type === allBranchesConstant) {
          populateBranchList(data);
        }
        if (type === buffetConstant) {
          populateBuffetList(data);
          populateMenuList(data);
        }
        if (type === branchMenuConstant) {
          populateMenuList(data, true);
        }
        if (type === corporateVerificationConstant) {
          showCorporateOtpScreen(data);
        }
        if (type === corporateEmailOtpVerificationConstant) {
          verifyCorporateEmailOtp(data);
        }
        if (type === showCouponsConstant) {
          populateCouponsAndVouchers(data, couponTypeConstant);
        }
        if (type === showVouchersConstant) {
          populateCouponsAndVouchers(data, voucherTypeConstant);
        }
        if (type === corporateOffersConstant) {
          populateCouponsAndVouchers(data, corporateOffersConstant);
        }
        if (type === createBookingConstant) {
          handleBooking(data);
        }
        if (type === payAdvanceAmountConstant) {
          proceedToBookingCheckout(data);
        }
        if (type === completeBookingConstant) {
          toastr.success('Payment completed successfully!');
          showBookingSuccessScreen(data, true);
        }
        if (type === getOccasionJoinedByConstant) {
          buildOccasionJoinedByHtml(data);
        }
        if (type === updateSpecialInstructionsConstant) {
          toastr.success('Updated successfully');
          $('#special-request').hide();
        }
        if (type === verifyCouponConstant) {
          applyCoupon(data, event);
        }
        if (type === getLoyaltyExchangeRateUrlConstant) {
          updateUserLoyaltyPoints(data);
        }
      },
      error(data) {
        if (corporateVerificationConstant) {
          showCorporateOtpScreen(data, true);
        }
        if (type === corporateEmailOtpVerificationConstant) {
          invalidCorporateEmailOtp();
        }
        if (type === createBookingConstant) {
          toastr.error(data.responseJSON.fieldErrors[0].message);
        }
        if (type === completeBookingConstant) {
          toastr.error('Payment failed, Please contact customer care.');
          redirectToHomePage();
        }
        if (type === showCouponsConstant) {
          toastr.error(data.responseJSON.fieldErrors[0].message);
        }
        if (type === showVouchersConstant) {
          toastr.error(data.responseJSON.fieldErrors[0].message);
        }
        if (type === corporateOffersConstant) {
          toastr.error(data.responseJSON.fieldErrors[0].message);
        }
        if (type === verifyCouponConstant) {
          toastr.error('Sorry, Unable to apply the coupon. Please try after sometime.');
        }
      }
    });
  }

  function updateUserLoyaltyPoints(data) {
    loyaltyPoints = data.available_points;
    loyaltyExchangeRate = data.redeem_amount / data.redeemable_points;
  }

  function proceedToBookingCheckout(data) {
    const options = {
      key: data.key,
      order_id: data.order_id,
      amount: data.amount,
      currency: data.currency,
      name: 'Barbeque Nation',
      image: '/themes/custom/bbq_nation/assets/images/bbqn-logo.svg',
      handler: ((transaction) => {
        completeBookingCheckout(transaction);
      }),
    };
    window.rzpay = new Razorpay(options);
    rzpay.open();
  }

  function buildOccasionJoinedByHtml(data) {
    if (!specialInstructionsBuilt) {
      let occasionHtml = '';
      let joinedByHtml = '';
      data.celebrating_for.forEach((occasion) => {
        occasionHtml += getOccasionJoinedByHtml(occasion.occasion_id, 'occasion', occasion.occasion_name);
      });
      data.joined_by.forEach((joinedBy) => {
        joinedByHtml += getOccasionJoinedByHtml(joinedBy.relationship_id, 'joined-by', joinedBy.relationship_name);
      });
      $('#occasion-list').html(occasionHtml);
      $('#joined-by-list').html(joinedByHtml);
      specialInstructionsBuilt = true;
    }
  }

  $('#advance-amount').on('input', (e) => {
    const amount = parseFloat(e.currentTarget.value);
    if (amount <= billAmount && amount > 0) {
      $('#booking-confirmed-pay-advance-amount').prop('disabled', false);
    } else {
      $('#booking-confirmed-pay-advance-amount').prop('disabled', true);
    }
  });

  function saveDataInLocalStorage() {
    const bookingDetails = {
      branchId: selectedBranchId,
      slotId: selectedSlotId,
      slotName: selectedSlotName,
      diningType: selectedDiningType,
      reservationDate: getFormattedReservationDate(selectedReservationDate),
      reservationTime: selectedReservationTime,
      preferredBranch: preferredBranch,
      branchList: branchList
    };
    localStorage.setItem('booking_details', JSON.stringify(bookingDetails));
  }

  function getFormattedDate(d) {
    return d.format('Do MMMM, YYYY');
  }

  function checkLocalStorageDetails() {
    const localBookingDetails = JSON.parse(localStorage.getItem('booking_details'));
    if (localBookingDetails && localBookingDetails.branchId && localBookingDetails.branchId !== 0 &&
      localBookingDetails.slotId && localBookingDetails.slotName && localBookingDetails.preferredBranch &&
      localBookingDetails.branchList && localBookingDetails.reservationDate) {
      selectedBranchId = localBookingDetails.branchId;
      selectedSlotId = localBookingDetails.slotId;
      selectedReservationTime = localBookingDetails.reservationTime;
      selectedSlotName = localBookingDetails.slotName;
      selectedDiningType = localBookingDetails.diningType;
      selectedReservationDate = moment(localBookingDetails.reservationDate);
      preferredBranch = localBookingDetails.preferredBranch;
      branchList = localBookingDetails.branchList;
      localStorage.removeItem('booking_details');
      return true;
    }
    return false;
  }

  function getBranchList() {
    if (branchList.length === 0) {
      bookingHttpRequest(getAllBranches, 'POST', undefined, allBranchesConstant);
    } else {
      populateBranchList(branchList);
    }
  }

  function updateReservationDate(date) {
    let selectedDate;
    if (date instanceof moment) {
      selectedDate = date;
    } else {
      selectedDate = moment(date, 'DD/MM/YYYY');
    }
    if (!selectedDate.isSame(selectedReservationDate)) {
      selectedReservationDate = selectedDate;
      setTodayTomorrowCheckBox();
      updateBookingInformation(selectedDate);
    }
  }

  function updateBookingInformation(reservationDate) {
    bookingHttpRequest(getNearbyBranches, 'POST', new SlotPostData(getFormattedReservationDate(reservationDate)), singleBranchConstant);
  }

  function getNearbyByBranches() {
    const reservationDate = getFormattedReservationDate(todayDate);
    updateBookingInformation(reservationDate);
  }

  function populateBranchList(data) {
    if (branchList.length === 0) {
      branchList = data;
    }
    const branchListValues = [];
    data.data.forEach((city) => {
      if (city.branches.length > 0) {
        branchListValues.push(branchListSelect2Values(city));
      }
    });
    $('.branch-dropdown').select2({
      data: branchListValues
    });
    if (selectedBranchId && populateNearbyBranches) {
      getNearbyByBranches();
    }
  }

  function branchListSelect2Values(city) {
    return {
      id: city.city_code,
      text: city.city_name,
      children: city.branches.map((branch) => {
        return {
          id: branch.branch_id,
          text: branch.branch_name
        }
      })
    };
  }

  function refreshData() {
    bookingHttpRequest(buffetListUrl, 'POST', new MenuPostData(), buffetConstant);
    //bookingHttpRequest(menuListUrl, 'POST', new MenuPostData(), menuConstant);
    cleanup();
  }

  function redirectToHomePage(time = 500) {
    setTimeout(function () {
      window.location.href = '/';
    }, time);
  }

  function getOccasionJoinedByHtml(id, name, label) {
    return `<input id="${name}-${id}" name="${name}" type="radio">
          <label for="${name}-${id}">${label}</label>`
  }

  function getVegNonVegClass(foodType) {
    let foodTypeClass;
    if (foodType === 'NONVEG') {
      foodTypeClass = 'nonveg';
    } else if (foodType === 'VEG') {
      foodTypeClass = 'veg';
    }
    return foodTypeClass;
  }

  function calculateTaxAmount() {
    let totalTax = 0;
    let taxHtml = '';
    let amount = getSubTotal();
    preferredBranch.taxDetails.forEach((tax) => {
      const taxAmount = amount * (tax.taxPercentage / 100);
      taxHtml += getTaxHtml(tax.tax, roundTaxAmount(taxAmount));
      totalTax += taxAmount;
    });
    if (preferredBranch.serviceCharge) {
      const serviceChargeAmount = amount * (preferredBranch.serviceCharge / 100);
      totalTax += serviceChargeAmount;
      taxHtml += getTaxHtml('Service Charge', roundTaxAmount(serviceChargeAmount));
    }
    totalTaxAndServiceAmount = parseFloat(roundTaxAmount(totalTax));
    $('#booking-tax-details').html(taxHtml);
  }

  function getTaxHtml(label, amount) {
    return `<div class="gst">
              <h5>${label}</h5>
              <span>${buffetCurrency}${amount}</span>
            </div>`
  }

  function roundTaxAmount(amount) {
    return amount.toFixed(2);
  }

  function getFormattedSlotTime(time) {
    const H = +time.substr(0, 2);
    let h = H % 12 || 12;
    h = (h < 10) ? ('0' + h) : h;
    const ampm = (H < 12 || H === 24) ? 'AM' : 'PM';
    return h + time.substr(2, 3) + ampm;
  }

  function generateMenuListHtml(buffetItems) {
    let buffetItemsHtml = '';
    buffetItems.forEach((item) => {
      buffetItemsHtml += `<div class="reservation__item-menu__block">
                          <div class="accordion" id="menu__accordion">
                            <div class="accordion-panel">
                                <div class="accordion-header">
                                    ${item.name}
                                    <span class="item__count">${item.menuItems.length} Items</span>
                                </div>
                                <div class="accordion-body">${generateMenuItemHtml(item.menuItems)}</div>
                            </div>
                          </div>
                        </div>`
    });
    return buffetItemsHtml;
  }

  function generateMenuItemHtml(menuItems) {
    let menuItemHtml = '';
    menuItems.forEach((item) => {
      let foodTypeClass = getVegNonVegClass(item.type);
      menuItemHtml += `<div class="menu__item__card">
                        <div class="menu__item__image">
                            <img alt="" src="${item.image}">
                        </div>
                        <div class="menu__item__content">
                          <div class="menu__item__title">
                            <div class="menu__item__category ${foodTypeClass}"></div>
                            <div class="menu__item__name">${item.name}</div>
                            <div class="menu__item__type">
                              <img alt="" src="${item.tags.image}">
                            </div>
                          </div>
                          <div class="menu__item__details">${item.description}</div>
                        </div>
                    </div>`
    });
    return menuItemHtml;
  }

  function voucherAndCouponItemHtml(title, voucherType, code, currency, amount, tempSubTotal, type, applicability, description) {
    let couponClass = 'booking-apply-coupon';
    let couponText;
    if (voucherType === couponTypeConstant && type && type === corporateOffersConstant) {
      couponText = 'Apply coupon';
      voucherType = corporateOffersConstant;
      if (appliedCorporateCoupon) {
        if (code === appliedCorporateCoupon.barCode) {
          couponClass = 'coupon-applied';
          couponText = 'Applied';
        } else {
          couponClass += ' anchor-disabled';
        }
      }
    } else if (voucherType === couponTypeConstant) {
      couponText = 'Apply coupon';
      if (appliedCoupon) {
        if (code === appliedCoupon.barCode) {
          couponClass = 'coupon-applied';
          couponText = 'Applied';
        } else {
          couponClass += ' anchor-disabled';
        }
      }
    } else if (voucherType === voucherTypeConstant) {
      couponText = 'Apply voucher';
      if (appliedVouchers && appliedVouchers.length > 0) {
        appliedVouchers.forEach((voucher) => {
          if (voucher.barCode === code) {
            couponClass = 'coupon-applied';
            couponText = 'Applied';
          }
        });
      }
    }
    if (amount > tempSubTotal && type !== voucherTypeConstant) {
      if (couponClass.substr(0, 14) !== 'coupon-applied') {
        couponClass += ' anchor-disabled';
      }
    }
    if (!applicability && type !== corporateOffersConstant) {
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
                <div class="${voucherType}">
                  <a id="${code}" class="${couponClass}" href="#">${couponText}</a>
                </div>
              </div>
              <div class="coupon-code">Code:
                <span>${code}</span>
              </div>
            </div>
          </div>`
  }

  function handleBooking(data) {
    bookingData = data;
    if (data.booking_status === 'CONFIRMED') {
      if (data.bill_total > 0) {
        showBookingSuccessScreen(data);
      } else {
        showBookingSuccessScreen(data, true);
      }
    }
    if (data.booking_status === 'PENDING') {
      bookingId = data.booking_id;
      advanceAmount = data.advance_amount;
      billAmount = data.bill_total;
      bookingHttpRequest(createBookingRazorpayOrderUrl, 'POST', {
        'booking_id': bookingId,
        'amount': advanceAmount,
        'currency': currency
      }, payAdvanceAmountConstant);
    }
  }

  function completeBookingCheckout(transaction) {
    const updateBooking = {
      'booking_id': bookingId,
      'payment_id': transaction.razorpay_payment_id,
      'payment_order_id': transaction.razorpay_order_id,
      'payment_signature': transaction.razorpay_signature,
      'payment_gateway': 'RAZOR_PAY'
    };
    bookingHttpRequest(createBookingUrl, 'PUT', updateBooking, completeBookingConstant);
  }

  function getBookingConfirmedItemsHtml(bookingDetails) {
    let itemsHtml = '';
    bookingDetails.forEach((item) => {
      buffetList.buffetData.forEach((buffet) => {
        if (item.buffet_id === parseInt(buffet.buffetId, 10)) {
          itemsHtml += getBookingConfirmedBuffetItemHtml(buffet.buffetImage, buffet.buffetName, item.packs);
        }
      });
    });
    return itemsHtml;
  }

  function getBookingConfirmedBuffetItemHtml(image, name, packs) {
    return `<div class="reservation__success__card row align-center space-between">
            <div class="reservation__success__left row align-center">
              <div class="reservation__success__image">
                <img src="${image}" alt="">
              </div>
              <div class="reservation__success__title">${name}</div>
            </div>
            <div class="reservation__success__right">
              <div class="reservation__success__count">${packs}</div>
            </div>
          </div>`
  }

  function appliedVoucherHtml(voucher, voucherType) {
    if (voucher) {
      let cssClass = 'remove-link';
      let divId;
      if (voucherType === voucherTypeConstant) {
        if (!voucherDiscountApplied) {
          voucherDiscountApplied = 0;
        }
        voucherDiscountApplied += voucher.denomination;
        divId = `applied-voucher-${voucher.barCode}`;
        cssClass += ' booking-remove-voucher';
      } else if (voucherType === couponTypeConstant) {
        if (!couponDiscountApplied) {
          couponDiscountApplied = 0;
        }
        couponDiscountApplied += voucher.denomination;
        divId = `applied-coupon-${voucher.barCode}`;
        cssClass += ' booking-remove-coupon';
      } else if (voucherType === corporateOffersConstant) {
        if (!couponDiscountApplied) {
          couponDiscountApplied = 0;
        }
        couponDiscountApplied += voucher.denomination;
        divId = `applied-coupon-${voucher.barCode}`;
        cssClass += ' booking-remove-corporate-coupon';
      }
      const offerText = `${getCurrencyCode(voucher.currency)} ${voucher.denomination.toLocaleString("en")} discount on the bill`;
      setAmountDetails();
      return `<div id=${divId} class="left">
            <div class="heading row align-center">
              <h5 class="coupon">${voucher.barCode}</h5>
              <a href="#" id="${voucher.barCode}" class="${cssClass}">Remove</a>
            </div>
            <span>${offerText}</span>
         </div>`;
    }
  }

  function generateBuffetItemHtml(buffet) {
    return `<div class="reservation__item">
            <div class="reservation__item__card">
              <div class="reservarion__image"><img src="${buffet.buffetImage}" alt="V1"></div>
                <div class="reservation__item__title">
                  <h5>${buffet.buffetName}</h5>
                  <span>${getCurrencyCode(buffet.buffetCurrency)}${buffet.buffetPrice}</span>
              </div>
              <input type="hidden" id="buffet-unit-price-${buffet.buffetId}" value="${buffet.buffetPrice}" />
              <div class="reservation__item__menu">
                  <a href="#" role="button">Items</a>
              </div>
              <div class="reservation__item__form-wrap">
              <form id="${buffet.buffetId}" class="form form--reservation">
                <div class="value-button decrease decrease-buffet-quantity"></div>
                <input type="text" class="buffet-quantity-${buffet.buffetId} number" value="0" readonly/>
                <div class="value-button increase increase-buffet-quantity"></div>
              </form>
              <span id="booking-buffet-total-${buffet.buffetId}" class="reservation__item__total"></span>
              </div>


            </div>
            <div class="reservation__item-menu">
              <div class="reservation__item-menu__close">
                <a class="close" href="#">Close</a>
              </div>
              <div class="reservation__item-menu__block-wrapper">
              ${generateMenuListHtml(buffet.buffetItems)}
              </div>
            </div>
          </div>`
  }

  function buildOtherMenu(item) {
    return `<div class="accordion-panel">
            <div class="accordion-header">
              ${item.menu_title}
              <span class="item__count">${item.menu_items.length} Items</span>
            </div>
            <div class="accordion-body">${generateMenuItemHtml(item.menu_items)}</div>
          </div>`
  }

  function buildBuffetMenuHtml(buffet) {
    return `<div class="accordion-panel">
            <div class="accordion-header">${buffet.buffet_name}
                <span class="item__count">${buffet.buffet_items.length} Items</span>
            </div>
            <div class="accordion-body">${buildBuffetItems(buffet.buffet_items)}</div>
        </div>`
  }

  function buildBuffetItems(buffetItems) {
    let buffetItemHtml = '';
    buffetItems.forEach((item) => {
      buffetItemHtml += `<div class="accordion-panel">
                        <div class="accordion-header">${item.name}
                            <span class="item__count">${item.menu_items.length} Items</span>
                        </div>
                        <div class="accordion-body">${generateMenuItemHtml(item.menu_items)}</div>
                      </div>`
    });
    return buffetItemHtml;
  }

  $('.reservation__corporate-link').click(function () {
    if (appliedCoupon) {
      toastr.error('You cannot apply corporate offer with coupon applied');
    } else if (getBookingTotal() < 1) {
      toastr.error('Please add more items to apply corporate offer');
    } else if (corporateVerified) {
      isCorporatePageActive = true;
      $('#reservation-info').hide();
      $('#coupons-vouchers').show();
      let totalQuantity = 0;
      bookingList.forEach((v, k) => {
        totalQuantity += v.packs;
      });
      const corporateData = {
        email: corporateEmail,
        packs: totalQuantity,
        reservation_date: getFormattedReservationDate(selectedReservationDate),
        branch_id: selectedBranchId,
        slot: selectedSlotId,
        amount: getBookingTotal()
      };
      bookingHttpRequest(getCorporateOffersUrl, 'POST', corporateData, corporateOffersConstant);
    } else {
      $('#corporate-offer').show();
      $('.reservation--curtain').addClass('open-corporate-form');
    }
  });

  $(document).on('click', '.share-reservation', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (bookingData) {
      $('#profile-share-booking-id').val(bookingData.booking_id);
    } else {
      $('#profile-share-booking-id').val(getBookingId(e));
    }
    $('#share-reservation-mail').removeClass('hide');
  });

  $('#profile-reservation-email-share-input').on('input', (e) => {
    if (validateEmail(e.target.value)) {
      enableShareEmailButton();
    } else {
      disableShareEmailButton();
    }
  });

  function disableShareEmailButton() {
    $('#profile-reservation-email-share-button').addClass('anchor-disabled');
  }

  function enableShareEmailButton() {
    $('#profile-reservation-email-share-button').removeClass('anchor-disabled');
  }

  function getBookingId(e) {
    return $(e.currentTarget).closest('article').attr('id');
  }

  $('#profile-reservation-email-share-button').click((e) => {
    let booking;
    if (bookingData) {
      booking = bookingData;
    } else {
      booking = profileBookingData.get($('#profile-share-booking-id').val());
    }
    $('#share-reservation-mail').addClass('hide');
    window.location.href = 'mailto:' + $('#profile-reservation-email-share-input').val() + '?' + getEmailShareSubject(booking) + '&' + getEmailShareBody(booking);
  });

  function getEmailShareSubject(booking) {
    return `subject=Booking #${booking.booking_id}`;
  }

  function getEmailShareBody(booking) {
    return `body=Hi, ${getMailLineBreak()}${getMailLineBreak()} I have placed a booking on ${formatDate(booking.reservation_date)} at ${booking.branch_name}.${getEmailBranchAddress(booking)}`;
  }

  function getEmailBranchAddress(booking) {
    return `${getMailLineBreak()}${getMailLineBreak()}Address: ${booking.branch_address} ${getMailLineBreak()} Directions: ${googleMapsUrl}${booking.lat},${booking.long} ${getMailLineBreak()} Contact Number: ${booking.branch_contact_no}`;
  }

  function getMailLineBreak() {
    return '%0D%0A';
  }

  $('#profile-reservation-email-share-close').click((e) => {
    e.preventDefault();
    $('#share-reservation-mail').addClass('hide');
  });

  $('.select2-selection').click(function () {
    $(this).toggleClass('show');
  });
  $('#basic-info__card-close').click(function (e) {
    showBasicInfoCard(e);
  });
  $('.basic-info__edit').click((e) => {
    showBasicInfoCard(e);
  });

  function showBasicInfoCard(e) {
    e.preventDefault();
    if ((appliedVouchers && appliedVouchers.length > 0) || appliedCoupon || applyLoyaltyPoints || appliedCorporateCoupon) {
      e.stopPropagation();
      toastr.error('Please remove the applied coupon/voucher and loyalty points');
    } else {
      $('.basic-info__card').hide();
      $('.basic-info__form').show();
      e.stopPropagation();
    }
  }

  $('#basic-info__form-done').click(function (e) {
    e.preventDefault();
    $('.basic-info__form').hide();
    $('.basic-info__card').show();
    e.stopPropagation();
  });

  $(document).on('click', '.value-button', () => {
    //showTotalVoucherAndCorporate();
  });

  $('#coupons-vouchers-close').click(function (e) {
    e.stopPropagation();
    $('#coupons-vouchers').hide();
    $('#reservation-info').show();
    //$('#coupon-input').show();
    isCorporatePageActive = false;
  });

  $('#corporate-offer-close').click(function () {
    $('#corporate-offer').hide();
    $('.reservation--curtain').removeClass('open-corporate-form');
    isCorporatePageActive = false;
  });
  $('#advance-pay-close').click(function () {
    $('#advance-pay').hide();
  });
  $('.reservation__success__reschedule').click(function () {
    $('#reservation-info').show();
    $('.reschedule-block').show();
    $('.no__slot__available').hide();
    $('#reservation__success').hide();
  });
  $('.reservation__success__cancel').click(function () {
    $('#reservation__success').hide();
    $('#reservation__cancellation').show();
  });
  $('.basic-info__menu').click(function (e) {
    e.preventDefault();
    $('.basic-info__menu-block').toggle();
  });
  $('#basic-info__menu-close').click(function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('.basic-info__menu-block').hide();
  });

  $('#curtain-close').click(function (e) {
    // $('.reservation--curtain').removeClass('reservation--visible');
    // e.preventDefault();
    // cleanup();
    window.location.reload();
  });

  $('#buffet-link').click(function (e) {
    e.preventDefault();
    $('#a-la-carte').hide();
    $('#buffet').show();
    $('#beverages').hide();
  });

  $('#a-la-carte-link').click(function (e) {
    e.preventDefault();
    $('#a-la-carte').show();
    $('#buffet').hide();
    $('#beverages').hide();
  });

  $('#beverages-link').click(function (e) {
    e.preventDefault();
    $('#a-la-carte').hide();
    $('#buffet').hide();
    $('#beverages').show();
  });

  $(document).on('click', '.reservation__item__menu a', (e) => {
    e.preventDefault();
    $('.reservation__item').removeClass('expanded');
    $(e.target).parent().parent().parent().addClass('expanded');
  });

  $(document).on('click', '.reservation__item-menu__close .close', (e) => {
    e.preventDefault();
    $(e.target).parent().parent().parent().removeClass('expanded');
  });

  $(window).scroll(function () {
    let scroll = $(window).scrollTop();
    const vouchersBlock = $('.vouchers-carousel-content-block');
    const branchOverviewBlock = $('.store-content');
    let vouchers;
    let position = 92;
    if (vouchersBlock.length > 0) {
      vouchers = vouchersBlock;
    } else {
      vouchers = branchOverviewBlock;
    }
    if (vouchers.offset() && vouchers.offset().top) {
      let vouchersPosition = vouchers.offset().top - position;
      const reservationButton = $('#reserve-button');
      let button = $('.input--group-button');
      if (scroll > vouchersPosition) {
        $(button).addClass('sticky');
        reservationButton.addClass('reservation-button-scroll-top');
        reservationButton.prop('disabled', false);
      } else {
        $(button).removeClass('sticky');
        reservationButton.removeClass('reservation-button-scroll-top');
        disableOrEnableReserveButton();
      }
    }
  });

})(jQuery, Drupal);

function formatDate(dateString) {
  return moment(dateString).format('dddd, DD MMM, h:mm a');
}

function validateEmail(email) {
  const emailPattern = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return emailPattern.test(email);
}

function getFormattedReservationDate(date) {
  return moment(date).format('YYYY-MM-DD');
}

function getDatePickerFormattedDate(date) {
  return date.format('DD/MM/YYYY');
}
