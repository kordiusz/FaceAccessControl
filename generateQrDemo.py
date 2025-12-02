import qrcode
uid = "aaabbbbcccdddd"

img = qrcode.make(uid)
img.save("kod.png")
