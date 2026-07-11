import os
import re

def replace_in_file(path, pattern, replacement):
    with open(path, 'r') as f:
        content = f.read()
    new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
    with open(path, 'w') as f:
        f.write(new_content)

# Fix UserListPage.tsx block action
path = 'src/components/social/UserListPage.tsx'
with open(path, 'r') as f:
    content = f.read()

# Exact string from previous view for Block
block_old = """            <KebabAction
              icon={<Ban className="w-4 h-4" />}
              label="Block"
              destructive
              onClick={() => {
                setShowKebabSheet(false);
                toast.success('Block coming soon');
              }}
            />"""

block_new = """            <KebabAction
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

if block_old in content:
    content = content.replace(block_old, block_new)
else:
    # Fallback to a looser regex if whitespace differs
    pattern = r'<KebabAction\s+icon={<Ban className="w-4 h-4" />}\s+label="Block"\s+destructive\s+onClick={() => \{.*?setShowKebabSheet\(false\);.*?toast\.success\(\'Block coming soon\'\);.*?\}\}\s+/>'
    content = re.sub(pattern, block_new, content, flags=re.DOTALL)

with open(path, 'w') as f:
    f.write(content)

# Fix NewConversationSheet.tsx
path = 'src/pages/messaging-v2/NewConversationSheet.tsx'
with open(path, 'r') as f:
    content = f.read()

# Lines 350-360 approx
# <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(247,147,30,0.08)', borderRadius: 11 }}>
#   <Sparkles size={16} color={AMBER} />
#   <span style={{ color: '#B45309', fontSize: 12.5, lineHeight: 1.4 }}>
#     Free during early access - business message limits are coming soon.
#   </span>
# </div>

pattern = r'<div\s+style={{\s+display: \'flex\',\s+alignItems: \'center\',\s+gap: 8,\s+padding: \'10px 12px\',\s+background: \'rgba\(247,147,30,0\.08\)\',\s+borderRadius: 11,\s+}}\s+>.*?<Sparkles size={16} color={AMBER} />.*?Free during early access - business message limits are coming soon\..*?</div>'
content = re.sub(pattern, '', content, flags=re.DOTALL)
# Also handle if it's slightly different
content = content.replace('Free during early access - business message limits are coming soon.', '')

with open(path, 'w') as f:
    f.write(content)

# Fix RivalryPage.tsx toast
replace_in_file('src/pages/RivalryPage.tsx', r"toast\('Messaging coming soon'\);", "// TODO: wire to messaging")

# Fix LiveNowModule.tsx comment
replace_in_file('src/features/tourhub/components/golf-universe/components/LiveNowModule.tsx', r'Coming Soon state', 'No coverage state')

