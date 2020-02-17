<?php

// Read the configuration.
$module_data = \Drupal::config('core.extension')->get('module');

// Unset the modules you do not need.
unset($module_data['content_export_csv']);

// Write the configuration.
\Drupal::configFactory()->getEditable('core.extension')->set('module', $module_data)->save();

