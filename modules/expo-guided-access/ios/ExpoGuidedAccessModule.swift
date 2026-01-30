import ExpoModulesCore
import UIKit

public class ExpoGuidedAccessModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGuidedAccess")

    // Synchronous function to check if Guided Access is currently enabled
    Function("isGuidedAccessEnabled") { () -> Bool in
      return UIAccessibility.isGuidedAccessEnabled
    }

    // Async function that also checks Guided Access status
    AsyncFunction("checkGuidedAccessStatus") { () -> [String: Any] in
      let isEnabled = UIAccessibility.isGuidedAccessEnabled
      return [
        "isEnabled": isEnabled,
        "platform": "ios"
      ]
    }

    // Event that fires when Guided Access status changes
    Events("onGuidedAccessStatusChange")

    // Start listening for Guided Access changes
    Function("startListening") { [weak self] in
      NotificationCenter.default.addObserver(
        forName: UIAccessibility.guidedAccessStatusDidChangeNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        let isEnabled = UIAccessibility.isGuidedAccessEnabled
        self?.sendEvent("onGuidedAccessStatusChange", [
          "isEnabled": isEnabled
        ])
      }
    }

    // Stop listening for Guided Access changes
    Function("stopListening") {
      NotificationCenter.default.removeObserver(
        self,
        name: UIAccessibility.guidedAccessStatusDidChangeNotification,
        object: nil
      )
    }
  }
}
