Pod::Spec.new do |s|
  s.name           = 'ExpoGuidedAccess'
  s.version        = '1.0.0'
  s.summary        = 'Expo module to detect iOS Guided Access status'
  s.description    = 'A native Expo module that exposes UIAccessibility.isGuidedAccessEnabled to JavaScript for implementing kiosk mode features'
  s.author         = 'My Calm Baby'
  s.homepage       = 'https://github.com/my-calm-baby'
  s.platforms      = { :ios => '13.4' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = '**/*.{h,m,mm,swift}'
end
