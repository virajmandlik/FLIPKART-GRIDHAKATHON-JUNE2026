import re

# =====================================================
# Valid Indian State / UT Codes
# =====================================================

STATE_CODES = {
    "AN", "AP", "AR", "AS", "BR", "CG", "CH", "DD", "DL", "DN",
    "GA", "GJ", "HP", "HR", "JH", "JK", "KA", "KL", "LA", "LD",
    "MH", "ML", "MN", "MP", "MZ", "NL", "OD", "PB", "PY", "RJ",
    "SK", "TN", "TR", "TS", "UK", "UP", "WB"
}


class PlateValidator:

    @staticmethod
    def clean(text):

        text = text.upper()

        # Remove all non-alphanumeric characters
        text = re.sub(r'[^A-Z0-9]', '', text)

        # Remove IND prefix
        text = re.sub(r'^IND', '', text)

        return text

    @staticmethod
    def correct_common_errors(text):

        chars = list(text)

        for i in range(len(chars)):

            # -----------------------------
            # State Code (Letters)
            # -----------------------------
            if i < 2:

                chars[i] = (
                    chars[i]
                    .replace("0", "O")
                    .replace("1", "I")
                    .replace("2", "Z")
                    .replace("5", "S")
                    .replace("8", "B")
                )

            # -----------------------------
            # District Number (Digits)
            # -----------------------------
            elif i < 4:

                chars[i] = (
                    chars[i]
                    .replace("O", "0")
                    .replace("I", "1")
                    .replace("Z", "2")
                    .replace("S", "5")
                    .replace("B", "8")
                )

            # -----------------------------
            # Registration Number (Digits)
            # -----------------------------
            elif i >= len(chars) - 4:

                chars[i] = (
                    chars[i]
                    .replace("O", "0")
                    .replace("I", "1")
                    .replace("Z", "2")
                    .replace("S", "5")
                    .replace("B", "8")
                )

        return "".join(chars)

    def validate(self, text):

        # Step 1 : Clean OCR Output
        text = self.clean(text)

        # Step 2 : Correct OCR mistakes
        text = self.correct_common_errors(text)

        # Standard Plate Format
        pattern = r'^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$'

        format_valid = bool(re.match(pattern, text))

        state = text[:2] if len(text) >= 2 else None

        state_valid = state in STATE_CODES if state else False

        return {

            "plate": text,

            "valid": format_valid and state_valid,

            "state": state,

            "district": text[2:4] if len(text) >= 4 else None,

            "series": text[4:-4] if len(text) > 8 else None,

            "number": text[-4:] if len(text) >= 4 else None

        }