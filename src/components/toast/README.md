# Toast

Lightweight toast banner styled to match the app.

```tsx
import { useState } from "react";
import { Toast } from "@/src/components/toast";

const [showToast, setShowToast] = useState(false);

<Toast
  visible={showToast}
  title="Door unlocked"
  message="Front door opened via Face ID"
  variant="success"
  onDismiss={() => setShowToast(false)}
  placement="bottom"
  offset={88} // keeps it clear of the bottom nav
/>
```

- `variant`: `default | success | info | warning | danger`
- `duration`: auto-dismiss in ms (set `null` to keep it on-screen)
- `placement`: `"top"` or `"bottom"` with optional `offset` padding
