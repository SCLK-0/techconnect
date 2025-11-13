# 📸 Visual Guide - Single Hook Setup

## The Dashboard Should Be Open

If not, click: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/hooks

---

## What You'll See

### Look for a button:
- "Add Hook" or
- "Enable Hooks" or
- "Create Hook"

### Click it!

---

## The Form

You'll see a form. Here's what to fill in:

### 1. Hook Name
```
┌─────────────────────────────────────────┐
│ Hook Name                               │
│ ┌─────────────────────────────────────┐ │
│ │ Send Email                          │ │ ← Type this
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. Hook Type
```
┌─────────────────────────────────────────┐
│ Hook Type                               │
│ ┌─────────────────────────────────────┐ │
│ │ Send Email              ▼           │ │ ← Select this
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 3. Events (IMPORTANT - Check BOTH!)
```
┌─────────────────────────────────────────┐
│ Events                                  │
│                                         │
│ ☑ Validate Email        ← CHECK THIS   │
│ ☑ Password Recovery     ← CHECK THIS   │
│ ☐ Email Change                          │
│ ☐ Other events...                       │
└─────────────────────────────────────────┘
```

**Important:** Make sure BOTH are checked!

### 4. Function URL
```
┌─────────────────────────────────────────┐
│ Function URL                            │
│ ┌─────────────────────────────────────┐ │
│ │ https://frozkocrdudvtqhhgqzl.       │ │
│ │ supabase.co/functions/v1/send-email │ │ ← Paste this
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Copy this:
```
https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-email
```

### 5. HTTP Method
```
┌─────────────────────────────────────────┐
│ HTTP Method                             │
│ ┌─────────────────────────────────────┐ │
│ │ POST                    ▼           │ │ ← Select this
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 6. HTTP Headers
```
┌─────────────────────────────────────────┐
│ HTTP Headers (optional)                 │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │ (leave this empty)                  │ │ ← Don't add anything
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 7. Click Create
```
┌─────────────────────────────────────────┐
│                                         │
│              [Cancel]  [Create]         │ ← Click Create
└─────────────────────────────────────────┘
```

---

## After Creating

You should see your hook listed:

```
┌─────────────────────────────────────────┐
│ Auth Hooks                              │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Send Email                          │ │
│ │ Type: Send Email                    │ │
│ │ Events: Validate Email, Password... │ │
│ │ URL: .../send-email                 │ │
│ │                          [Edit] [...] │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

✅ Perfect!

---

## Then Configure Email Provider

Go to: https://supabase.com/dashboard/project/frozkocrdudvtqhhgqzl/auth/providers

Find "Email" section:

```
┌─────────────────────────────────────────┐
│ Email                                   │
├─────────────────────────────────────────┤
│                                         │
│ ☑ Enable email provider     ← CHECKED  │
│                                         │
│ ☐ Confirm email             ← UNCHECKED│
│   (Important: uncheck this!)            │
│                                         │
│ ☑ Enable email signup       ← CHECKED  │
│                                         │
│                            [Save]       │ ← Click Save
└─────────────────────────────────────────┘
```

---

## Test!

1. Go to http://localhost:8080
2. Register a new user
3. Check your email
4. You should receive a beautiful confirmation email! 🎉

---

## Troubleshooting

### "I don't see checkboxes for events"
- Look for a section labeled "Events" or "Triggers"
- There should be multiple checkboxes
- Check both "Validate Email" and "Password Recovery"

### "I can only check one event"
- That's okay! Check "Validate Email" first
- The function will still work for both
- (But try to find a way to check both if possible)

### "Hook requires authorization token"
- Make sure HTTP Headers is completely EMPTY
- Don't add any headers at all

---

## Quick Copy-Paste

**Function URL:**
```
https://frozkocrdudvtqhhgqzl.supabase.co/functions/v1/send-email
```

**Hook Name:**
```
Send Email
```

---

## That's It!

Super simple. One hook. Two minutes. Done! 🚀
