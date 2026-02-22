
-- Clear existing rivalries and repopulate with researched data
DELETE FROM college_rivalries;

INSERT INTO college_rivalries (college_a, college_b, weight) VALUES
-- Tier 1: Historic Powerhouse Rivalries (weight 10)
('oklahomastate', 'arizonastate', 10),
('oklahomastate', 'oklahoma', 10),
('texas', 'oklahomastate', 10),
('texas', 'arizonastate', 10),
('stanford', 'california', 10),
('stanford', 'texas', 10),
('alabama', 'oklahomastate', 10),
('georgia', 'georgiatech', 10),
('florida', 'floridastate', 10),

-- Tier 2: Conference & Regional Rivalries (weight 7)
('texas', 'texasam', 7),
('auburn', 'alabama', 7),
('duke', 'northcarolina', 7),
('wakeforest', 'duke', 7),
('wakeforest', 'northcarolina', 7),
('clemson', 'georgiatech', 7),
('oklahoma', 'texas', 7),
('arizonastate', 'usc', 7),
('oregon', 'stanford', 7),
('ucla', 'usc', 7),
('vanderbilt', 'tennessee', 7),
('lsu', 'alabama', 7),
('pepperdine', 'usc', 7),
('illinois', 'northwestern', 7),
('virginia', 'virginiatech', 7),

-- Tier 3: Emerging Rivalries (weight 4)
('florida', 'auburn', 4),
('olemiss', 'mississippistate', 4),
('southcarolina', 'clemson', 4),
('texastech', 'tcu', 4),
('smu', 'tcu', 4),
('arizona', 'arizonastate', 4);
