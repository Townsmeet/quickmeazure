// Google Identity Services API type declarations

declare global {
  interface GoogleIdConfiguration {
    client_id: string
    callback: (response: CredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    context?: 'signin' | 'signup' | 'use'
    ux_mode?: 'popup' | 'redirect'
    login_uri?: string
    native_callback?: (response: CredentialResponse) => void
    intermediate_iframe_close_callback?: () => void
    itp_support?: boolean
    state_cookie_domain?: string
    allowed_parent_origin?: string | string[]
    nonce?: string
    moment_callback?: (promptMomentNotification: PromptMomentNotification) => void
  }

  interface CredentialResponse {
    credential: string
    select_by:
      | 'auto'
      | 'user'
      | 'user_1tap'
      | 'user_2tap'
      | 'btn'
      | 'btn_confirm'
      | 'brn_add_session'
      | 'btn_confirm_add_session'
    clientId?: string
  }

  interface PromptMomentNotification {
    isDisplayMoment: () => boolean
    isDisplayed: () => boolean
    isNotDisplayed: () => boolean
    getNotDisplayedReason: () =>
      | 'browser_not_supported'
      | 'invalid_client'
      | 'missing_client_id'
      | 'opt_out_or_no_session'
      | 'secure_http_required'
      | 'suppressed_by_user'
      | 'unregistered_origin'
      | 'unknown_reason'
    isSkippedMoment: () => boolean
    getSkippedReason: () => 'auto_cancel' | 'user_cancel' | 'tap_outside' | 'issuing_failed'
    isDismissedMoment: () => boolean
    getDismissedReason: () => 'credential_returned' | 'cancel_called' | 'flow_restarted'
    getMomentType: () => 'display' | 'skipped' | 'dismissed'
  }

  interface RevocationResponse {
    successful: boolean
    error?: string
  }

  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void
          prompt: (callback?: (notification: PromptMomentNotification) => void) => void
          cancel: () => void
          disableAutoSelect: () => void
          storeCredential: (credential: { id: string; password: string }) => void
          revoke: (hint: string, callback: (done: RevocationResponse) => void) => void
        }
      }
    }
  }
}

export {}
