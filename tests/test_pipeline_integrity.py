"""Automated tests for ComFuse label mapping, inference consistency, and API integrity."""
import os
import sys
import unittest
import torch
import torch.nn.functional as F
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import config
from src.inference import ComplaintPredictor

class TestComFuseIntegrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ckpt_path = os.path.join(config.MODELS_DIR, "best_multimodal_model.pt")
        cls.predictor = ComplaintPredictor(checkpoint_path=cls.ckpt_path)

    def test_aspect_mapping_integrity(self):
        """Verify that Aspect class mappings match canonical ordering 0..5."""
        expected_aspects = ["Software", "Hardware", "Quality", "Service", "Price", "Packaging"]
        self.assertEqual(config.ASPECT_CLASSES, expected_aspects)
        for idx, name in enumerate(expected_aspects):
            self.assertEqual(config.ASPECT2ID[name], idx)
            self.assertEqual(config.ID2ASPECT[idx], name)

    def test_severity_mapping_integrity(self):
        """Verify that Severity class mappings match canonical ordering 0..3."""
        expected_severities = ["No Explicit Reproach", "Disapproval", "Accusation", "Blame"]
        self.assertEqual(config.SEVERITY_CLASSES, expected_severities)
        for idx, name in enumerate(expected_severities):
            self.assertEqual(config.SEVERITY2ID[name], idx)
            self.assertEqual(config.ID2SEVERITY[idx], name)

    def test_predictor_eval_mode(self):
        """Verify that the model is in eval mode and dropout is disabled."""
        self.assertFalse(self.predictor.model.training, "Model should be in eval() mode")
        for m in self.predictor.model.modules():
            if isinstance(m, torch.nn.Dropout):
                self.assertFalse(m.training, "Dropout layers must not be active in inference")

    def test_confidence_computation(self):
        """Verify softmax is applied once along dim=-1 and sums to 1.0."""
        logits = torch.tensor([[2.5, -1.0, 0.5, 3.2]])
        probs = F.softmax(logits, dim=-1).numpy()[0]
        self.assertAlmostEqual(float(np.sum(probs)), 1.0, places=5)
        # Verify argmax matches
        pred_idx = int(np.argmax(probs))
        self.assertEqual(pred_idx, 3) # 3.2 is max
        self.assertEqual(config.ID2SEVERITY[pred_idx], "Blame")

    def test_direct_vs_dict_prediction(self):
        """Verify that the prediction label returned matches the argmax of the probabilities."""
        res = self.predictor.predict(text="Device casing broke after one drop")
        # Check aspect
        asp_dict = res["aspect_probs"]
        max_asp_label = max(asp_dict, key=asp_dict.get)
        self.assertEqual(res["aspect_prediction"], max_asp_label)
        self.assertAlmostEqual(res["aspect_confidence"], asp_dict[max_asp_label] * 100.0, places=2)

        # Check severity
        sev_dict = res["severity_probs"]
        max_sev_label = max(sev_dict, key=sev_dict.get)
        self.assertEqual(res["severity_prediction"], max_sev_label)
        self.assertAlmostEqual(res["severity_confidence"], sev_dict[max_sev_label] * 100.0, places=2)

if __name__ == "__main__":
    unittest.main()
