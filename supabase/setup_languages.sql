
-- Initialize languages if the table is empty
INSERT INTO languages (id, name, sentences, upload_date)
SELECT 
  'lang_hindi', 
  'Hindi', 
  ARRAY['नमस्ते, आप कैसे हैं?', 'मैं अच्छा हूँ, धन्यवाद।', 'यह एक परीक्षण वाक्य है।'], 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 'lang_hindi');

INSERT INTO languages (id, name, sentences, upload_date)
SELECT 
  'lang_tamil', 
  'Tamil', 
  ARRAY['வணக்கம், எப்படி இருக்கிறீர்கள்?', 'நான் நன்றாக இருக்கிறேன், நன்றி.', 'இது ஒரு சோதனை வாக்கியம்.'], 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 'lang_tamil');

INSERT INTO languages (id, name, sentences, upload_date)
SELECT 
  'lang_telugu', 
  'Telugu', 
  ARRAY['నమస్కారం, మీరు ఎలా ఉన్నారు?', 'నేను బాగున్నాను, ధన్యవాదాలు.', 'ఇది పరీక్ష వాక్యం.'], 
  NOW() 
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 'lang_telugu');

INSERT INTO languages (id, name, sentences, upload_date)
SELECT 
  'lang_kannada', 
  'Kannada', 
  ARRAY['ನಮಸ್ಕಾರ, ನೀವು ಹೇಗಿದ್ದೀರಿ?', 'ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದಗಳು.', 'ಇದು ಪರೀಕ್ಷೆಯ ವಾಕ್ಯವಾಗಿದೆ.'], 
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 'lang_kannada');

INSERT INTO languages (id, name, sentences, upload_date)
SELECT 
  'lang_malayalam', 
  'Malayalam', 
  ARRAY['നമസ്കാരം, നിങ്ങൾ എങ്ങനെ ഉണ്ട്?', 'എനിക്ക് നന്നായി ഉണ്ട്, നന്ദി.', 'ഇത് ഒരു പരീക്ഷണ വാക്യമാണ്.'], 
  NOW() 
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 'lang_malayalam');

INSERT INTO languages (id, name, sentences, upload_date)
SELECT 
  'lang_english', 
  'English', 
  ARRAY['Hello, how are you?', 'I am fine, thank you.', 'This is a test sentence.'], 
  NOW() 
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 'lang_english');

INSERT INTO languages (id, name, sentences, upload_date)
SELECT 
  'lang_bengali', 
  'Bengali', 
  ARRAY['নমস্কার, আপনি কেমন আছেন?', 'আমি ভালো আছি, ধন্যবাদ।', 'এটি একটি পরীক্ষামূলক বাক্য।'], 
  NOW() 
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 'lang_bengali');

INSERT INTO languages (id, name, sentences, upload_date)
SELECT 
  'lang_marathi', 
  'Marathi', 
  ARRAY['नमस्कार, तुम्ही कसे आहात?', 'मी ठीक आहे, धन्यवाद.', 'हे एक चाचणी वाक्य आहे.'], 
  NOW() 
WHERE NOT EXISTS (SELECT 1 FROM languages WHERE id = 'lang_marathi');

-- Initialize admin settings if the table is empty
INSERT INTO admin_settings (id, password, auto_sync, storage_type, google_connected)
SELECT 
  'admin', 
  'admin', 
  false, 
  'supabase', 
  false
WHERE NOT EXISTS (SELECT 1 FROM admin_settings WHERE id = 'admin');
