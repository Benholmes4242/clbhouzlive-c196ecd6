import os
import re

def replace_in_file(path, pattern, replacement):
    with open(path, 'r') as f:
        content = f.read()
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
    with open(path, 'w') as f:
        f.write(new_content)

# 1. UserListPage.tsx
path = 'src/components/social/UserListPage.tsx'
with open(path, 'r') as f:
    lines = f.readlines()

# Clean up previous failed attempts if any
new_lines = []
for line in lines:
    if 'const { blockUser } = useBlockActions' in line: continue
    new_lines.append(line)

# Re-insert hook call correctly
for i, line in enumerate(new_lines):
    if 'const UserRowFlat' in line:
        # Find the start of the component body
        j = i + 1
        while '{' not in new_lines[j]: j += 1
        new_lines.insert(j + 1, "  const { blockUser } = useBlockActions({ currentUserId: currentUserId || '' });\n")
        break

content = "".join(new_lines)

# Update Block action
block_pattern = r'<KebabAction\s+icon={<Ban className="w-4 h-4" />}\s+label="Block"\s+destructive\s+onClick={() => \{.*?toast\.success\(\'Block coming soon\'\);\s+\}\}\s+/>'
block_replacement = """<KebabAction
              icon={<Ban className="w-4 h-4" />}
              label="Block"
              destructive
              onClick={async () => {
                setShowKebabSheet(false);
                try {
                  const success = await blockUser(user.id);
                  if (success) {
                    toast.success(`Blocked ${user.displayName}`);
                  } else {
                    toast.error("Could not block. Try again.");
                  }
                } catch (err) {
                  toast.error("Could not block. Try again.");
                }
              }}
            />"""
content = re.sub(block_pattern, block_replacement, content)

# Remove Mute notifications KebabAction
mute_pattern = r'<KebabAction\s+icon={<BellOff className="w-4 h-4" />}\s+label="Mute notifications".*?/>\s*'
content = re.sub(mute_pattern, '', content)

with open(path, 'w') as f:
    f.write(content)

# 2. NewConversationSheet.tsx
path = 'src/pages/messaging-v2/NewConversationSheet.tsx'
with open(path, 'r') as f:
    content = f.read()
# Removing the early access banner div
pattern = r'<div\s+style={{\s+display: \'flex\',\s+alignItems: \'center\',\s+gap: 8,\s+padding: \'10px 12px\',\s+background: \'rgba\(247,147,30,0\.08\)\',\s+borderRadius: 11,\s+}}\s+>.*?</div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)
with open(path, 'w') as f:
    f.write(content)

# 3. RivalryPage.tsx
path = 'src/pages/RivalryPage.tsx'
with open(path, 'r') as f:
    content = f.read()
# Remove handleMessage
content = re.sub(r'const handleMessage = \(\) => \{.*?\};', '', content, flags=re.DOTALL)
# Remove ActionRail onMessage prop (already removed from ActionRail.tsx)
content = content.replace('onMessage={handleMessage}', '')
with open(path, 'w') as f:
    f.write(content)

