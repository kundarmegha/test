(function ($, Drupal) {
  'use strict';
  console.log('hi');
  var arr = [1, 2, 3, 4, 5];
  var index = null;
  for (index in arr) {
    function myFunc() { };
  }
  Drupal.behaviors.myModuleBehavior = {
  };
})(jQuery, Drupal);
