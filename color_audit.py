import re
import os
import colorsys

# Tokens from src/lib/tokens/surfaces.ts
tokens = {
    "PAGE_CANVAS": (21, 23, 31),
    "SHEET_SURFACE": (21, 23, 31),
    "INK_ON_LIGHT": (21, 23, 31),
    "MEMBER_PANEL": (27, 30, 39),
    "MEMBER_CELL": (32, 36, 46),
    "IMMERSIVE_FEED_CANVAS": (5, 7, 10),
    "FEED_CARD_SURFACE": (16, 21, 28),
    "ECHO_RAISED_SURFACE": (24, 31, 40),
    "COMPOSER_SHELL_SURFACE": (11, 15, 20),
    "COMPOSER_PANEL_SURFACE": (27, 34, 43),
    "APP_SHELL_SURFACE": (13, 13, 13),
    "DESKTOP_GUTTER_SURFACE": (10, 10, 10),
    "NEAR_BLACK_CONTROL_SURFACE": (10, 10, 10),
    "DISCOVER_SHELL_SURFACE": (10, 14, 20),
    "TOUR_HUB_RAISED_SURFACE": (20, 20, 20),
    "LIGHT_ROUTE_CANVAS": (248, 250, 252),
    "LIGHT_IMMERSIVE_CANVAS": (15, 23, 42),
    "SLATE_CONTROL_SURFACE": (15, 23, 42),
    "POST_DEEP_LINK_CANVAS": (13, 15, 17),
    "SUSPENSION_SURFACE": (15, 23, 42),
    "ECHO_HISTORY_CANVAS": (8, 9, 11),
    "ECHO_HISTORY_PANEL": (20, 24, 30),
    "ECHO_HISTORY_ACTION": (29, 34, 42),
}

rgb_to_tokens = {}
for name, rgb in tokens.items():
    if rgb not in rgb_to_tokens:
        rgb_to_tokens[rgb] = []
    rgb_to_tokens[rgb].append(name)

css_files = []
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.css'):
            css_files.append(os.path.join(root, file))

results = {
    "exact_matches": [],
    "echo_opaque": [],
    "rgba_15_23_42": [],
    "neutral_scrims": [],
    "near_misses": []
}

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def hsla_to_rgb(h, s, l):
    r, g, b = colorsys.hls_to_rgb(h/360.0, l/100.0, s/100.0)
    return (round(r*255), round(g*255), round(b*255))

rgba_pattern = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d\.]+)\s*)?\)')
hsla_pattern = re.compile(r'hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d\.]+)\s*)?\)')
hex8_pattern = re.compile(r'#([0-9a-fA-F]{8})')
hex6_pattern = re.compile(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')

for file_path in css_files:
    with open(file_path, 'r') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            line_num = i + 1
            
            # Echo chat opaque check
            if "echo-chat.css" in file_path:
                for m in hex6_pattern.findall(line):
                    if m.upper() == "05070A":
                        results["echo_opaque"].append(f"IMMERSIVE_FEED_CANVAS / - / {file_path}:{line_num} / #{m}")

            # RGBA
            for r, g, b, a in rgba_pattern.findall(line):
                rgb = (int(r), int(g), int(b))
                alpha = a if a else "1"
                if rgb == (15, 23, 42):
                    results["rgba_15_23_42"].append(f"LIGHT_IMMERSIVE_CANVAS / {alpha} / {file_path}:{line_num} / rgba({r},{g},{b},{alpha})")
                elif rgb in rgb_to_tokens:
                    token_names = "/".join(rgb_to_tokens[rgb])
                    results["exact_matches"].append(f"{token_names} / {alpha} / {file_path}:{line_num} / rgba({r},{g},{b},{alpha})")
                elif rgb == (0, 0, 0) or rgb == (255, 255, 255):
                    results["neutral_scrims"].append(f"SCRIM / {alpha} / {file_path}:{line_num} / rgba({r},{g},{b},{alpha})")
                else:
                    for token_rgb, names in rgb_to_tokens.items():
                        if all(abs(rgb[j] - token_rgb[j]) <= 2 for j in range(3)):
                            token_names = "/".join(names)
                            results["near_misses"].append(f"NEAR MISS {token_names} / {alpha} / {file_path}:{line_num} / rgba({r},{g},{b},{alpha})")

            # HSLA
            for h, s, l, a in hsla_pattern.findall(line):
                rgb = hsla_to_rgb(int(h), int(s), int(l))
                alpha = a if a else "1"
                if rgb in rgb_to_tokens:
                    token_names = "/".join(rgb_to_tokens[rgb])
                    results["exact_matches"].append(f"{token_names} / {alpha} / {file_path}:{line_num} / hsla({h},{s}%,{l}%,{alpha})")
                elif rgb == (15, 23, 42):
                    results["rgba_15_23_42"].append(f"LIGHT_IMMERSIVE_CANVAS / {alpha} / {file_path}:{line_num} / hsla({h},{s}%,{l}%,{alpha})")
                elif rgb == (0, 0, 0) or rgb == (255, 255, 255):
                    results["neutral_scrims"].append(f"SCRIM / {alpha} / {file_path}:{line_num} / hsla({h},{s}%,{l}%,{alpha})")

            # Hex8
            for m in hex8_pattern.findall(line):
                rgb = (int(m[0:2], 16), int(m[2:4], 16), int(m[4:6], 16))
                a = round(int(m[6:8], 16) / 255.0, 3)
                if rgb in rgb_to_tokens:
                    token_names = "/".join(rgb_to_tokens[rgb])
                    results["exact_matches"].append(f"{token_names} / {a} / {file_path}:{line_num} / #{m}")
                elif rgb == (15, 23, 42):
                    results["rgba_15_23_42"].append(f"LIGHT_IMMERSIVE_CANVAS / {a} / {file_path}:{line_num} / #{m}")
                elif rgb == (0, 0, 0) or rgb == (255, 255, 255):
                    results["neutral_scrims"].append(f"SCRIM / {a} / {file_path}:{line_num} / #{m}")

# Print groupings
def print_section(title, data):
    print(f"\n{title}")
    for r in sorted(data):
        print(r)

print_section("### EXACT MATCHES (Token / Alpha / File:Line / Literal)", results["exact_matches"])
print_section("### OPAQUE #05070A IN ECHO-CHAT", results["echo_opaque"])
print_section("### RGBA(15,23,42,x) MATCHES", results["rgba_15_23_42"])
print_section("### NEUTRAL BLACK/WHITE SCRIMS", results["neutral_scrims"])
print_section("### NEAR MISS TRIPLETS", results["near_misses"])

# CSS Variable grouping analysis
var_groupings = {}
for entry in results["exact_matches"] + results["rgba_15_23_42"] + results["neutral_scrims"]:
    parts = entry.split(" / ")
    if len(parts) < 3: continue
    file = parts[2].split(":")[0]
    token = parts[0]
    alpha = parts[1]
    key = (file, token, alpha)
    if key not in var_groupings:
        var_groupings[key] = []
    var_groupings[key].append(parts[2].split(":")[1])

print("\n### SUITABLE SINGLE-OWNED CSS VARIABLE GROUPINGS")
for (file, token, alpha), lines in sorted(var_groupings.items()):
    if len(lines) > 1:
        print(f"{file}: {token} with alpha {alpha} used on lines {', '.join(lines)}")

