// ============================================================================
// hook_bridge.cpp - System-Wide Keyboard Interception Bridge for KeyPressMonitor
// 
// Uses Win32 Low-Level Keyboard Hook (WH_KEYBOARD_LL) to capture keystrokes globally
// across any active desktop application (Notepad, Chrome, VS Code, games) and
// forward telemetry to KeyPressMonitor.
//
// Inspired by Shobdomala (bilingual IME prototype).
// Compile: cl /EHsc /O2 hook_bridge.cpp user32.lib
// ============================================================================

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <iostream>
#include <chrono>

static HHOOK g_hHook = NULL;
static uint64_t g_totalKeys = 0;
static uint64_t g_vowels = 0;
static uint64_t g_consonants = 0;

static inline bool IsVowel(char c) {
    c = (char)tolower((unsigned char)c);
    return (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u');
}

LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION && (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN)) {
        KBDLLHOOKSTRUCT* pKey = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);

        if ((pKey->flags & LLKHF_INJECTED) == 0) {
            BYTE keyboardState[256] = {0};
            GetKeyboardState(keyboardState);

            WCHAR unicodeChar[4] = {0};
            int len = ToUnicode(pKey->vkCode, pKey->scanCode, keyboardState, unicodeChar, 4, 0);

            if (len > 0) {
                WCHAR ch = unicodeChar[0];
                g_totalKeys++;

                if (ch >= 0x0985 && ch <= 0x0994) {
                    g_vowels++;
                } else if (ch >= 0x09BE && ch <= 0x09CC) {
                    g_vowels++;
                } else if (ch >= 0x0995 && ch <= 0x09B9) {
                    g_consonants++;
                } else if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')) {
                    if (IsVowel((char)ch)) g_vowels++;
                    else g_consonants++;
                }
            }
        }
    }
    return CallNextHookEx(g_hHook, nCode, wParam, lParam);
}

int main() {
    std::cout << "========================================================\n";
    std::cout << " KeyPressMonitor - System-Wide Keyboard Hook (WH_KEYBOARD_LL)\n";
    std::cout << " Capturing keystrokes globally across all windows...\n";
    std::cout << " Press Ctrl+C in this console to terminate hook.\n";
    std::cout << "========================================================\n";

    HINSTANCE hInstance = GetModuleHandle(NULL);
    g_hHook = SetWindowsHookExW(WH_KEYBOARD_LL, LowLevelKeyboardProc, hInstance, 0);

    if (!g_hHook) {
        std::cerr << "[ERROR] Failed to install low-level keyboard hook! Error code: " 
                  << GetLastError() << "\n";
        return 1;
    }

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    UnhookWindowsHookEx(g_hHook);
    return 0;
}
