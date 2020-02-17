(function ($, Drupal) {
  'use strict';
  var arr = [1, 2, 3, 4, 5];
  var index = null;
  for (index in arr) {
    function myFunc() { };
  }
  Drupal.behaviors.myModuleBehavior = {
  };
})(jQuery, Drupal);
