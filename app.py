"""Interactive Gradio Web Application for Multimodal Customer Complaint Classification."""
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import gradio as gr
from PIL import Image
import pandas as pd

import config
from src.inference import ComplaintPredictor

# Initialize predictor
predictor = ComplaintPredictor()

def analyze_complaint(text, image):
    """Callback function for complaint analysis."""
    if not text or not str(text).strip():
        return (
            "Please provide complaint text",
            "0.00%",
            {},
            "Please provide complaint text",
            "0.00%",
            {},
            "None",
            "Please enter a valid complaint text to analyze."
        )
        
    result = predictor.predict(text=text, image_input=image)
    
    aspect_pred = result["aspect_prediction"]
    aspect_conf = f"{result['aspect_confidence']:.2f}%"
    aspect_probs = {k: round(v, 4) for k, v in result["aspect_probs"].items()}
    
    severity_pred = result["severity_prediction"]
    severity_conf = f"{result['severity_confidence']:.2f}%"
    severity_probs = {k: round(v, 4) for k, v in result["severity_probs"].items()}
    
    mode = result["mode"]
    explanation = result["explanation"]
    
    return (
        aspect_pred,
        aspect_conf,
        aspect_probs,
        severity_pred,
        severity_conf,
        severity_probs,
        mode,
        explanation
    )

# Prepare 5 real demo examples from the dataset
DEMO_DIR = os.path.join(config.PROCESSED_DATA_DIR, "images")
ASSETS_DIR = os.path.join(config.BASE_DIR, "assets", "demo_images")

def get_demo_img(filename):
    for d in [DEMO_DIR, ASSETS_DIR]:
        p = os.path.join(d, filename)
        if os.path.exists(p):
            return p
    return None

examples = [
    [
        "Tweet 1. @120401 When you have a moment, please send us over a DM. We're happy to work together with you on this. Tweet 2. @AppleSupport So I schedule a call with support. The lady I get on the phone downplays the issue and hangs up on me. Apple support at it’s best?! #fail",
        get_demo_img("sample_0413_thread_414.jpg")
    ],
    [
        "Tweet 1. @AppleSupport Oh no I’m just trying to remind you that removing the headphone jack was an awful idea @116333 @115858 Tweet 2. @AppleSupport yet another head phone adapter isn’t working",
        get_demo_img("sample_0455_thread_456.jpg")
    ],
    [
        "Tweet 1. @AppleSupport I put a text replacement for the letter 'I' and it keeps removing it. Typing on iOS is totally glitchy and broken!",
        get_demo_img("sample_0267_thread_268.jpg")
    ],
    [
        "Tweet 1. @AppleSupport need help with Storage issues on my 6s. I’ve deleted pretty much everything and it’s still full with 'other' system storage. How do I fix this?",
        get_demo_img("sample_0552_thread_553.jpg")
    ],
    [
        "Tweet 1. @AppleSupport Hi, do you have customer support for delivery? I want to change my delivery packaging and shipping address on an order placed. Thanks",
        get_demo_img("sample_0488_thread_489.jpg")
    ]
]

custom_css = """
.container { max-width: 1000px; margin: auto; }
.header-box { text-align: center; margin-bottom: 20px; }
.badge { font-weight: bold; padding: 4px 10px; border-radius: 4px; display: inline-block; }
.badge-multimodal { background-color: #e6f7ff; color: #0050b3; border: 1px solid #91d5ff; }
.badge-text { background-color: #fff7e6; color: #d46b08; border: 1px solid #ffd591; }
"""

with gr.Blocks(title="Multimodal Customer Complaint Analyzer") as demo:
    with gr.Column(elem_classes=["container"]):
        gr.Markdown(
            """
            # 🎯 Multimodal Customer Complaint Analyzer
            ### *Transformer + CNN based multimodal complaint classification*
            
            This system fuses **DistilBERT** text embeddings and **ResNet-18** visual embeddings to predict **Complaint Aspect** and **Complaint Severity** with dual classification heads.
            """
        )
        
        with gr.Row():
            with gr.Column(scale=5):
                text_input = gr.Textbox(
                    lines=5,
                    placeholder="Enter customer complaint text (e.g., tweet thread or feedback)...",
                    label="Customer Complaint Text"
                )
                image_input = gr.Image(
                    type="pil",
                    label="Upload Complaint Image / Screenshot (Optional)"
                )
                analyze_btn = gr.Button("🔍 ANALYZE COMPLAINT", variant="primary", size="lg")
                
            with gr.Column(scale=5):
                gr.Markdown("### 📊 PREDICTION RESULTS")
                with gr.Row():
                    aspect_output = gr.Textbox(label="Predicted Aspect", interactive=False)
                    aspect_conf_output = gr.Textbox(label="Aspect Confidence", interactive=False)
                aspect_probs_output = gr.Label(label="Aspect Probability Distribution", num_top_classes=4)
                
                with gr.Row():
                    sev_output = gr.Textbox(label="Predicted Severity", interactive=False)
                    sev_conf_output = gr.Textbox(label="Severity Confidence", interactive=False)
                sev_probs_output = gr.Label(label="Severity Probability Distribution", num_top_classes=4)
                
                with gr.Row():
                    mode_output = gr.Textbox(label="Prediction Mode", interactive=False)
                
                explanation_output = gr.Textbox(
                    label="Architecture Explanation",
                    interactive=False,
                    lines=3
                )
                
        gr.Markdown("---")
        gr.Markdown("### 📂 DEMO EXAMPLES (Click to Populate)")
        gr.Examples(
            examples=examples,
            inputs=[text_input, image_input],
            outputs=[
                aspect_output,
                aspect_conf_output,
                aspect_probs_output,
                sev_output,
                sev_conf_output,
                sev_probs_output,
                mode_output,
                explanation_output
            ],
            fn=analyze_complaint,
            cache_examples=False,
            label="Representative Test Set Complaints"
        )
        
        analyze_btn.click(
            fn=analyze_complaint,
            inputs=[text_input, image_input],
            outputs=[
                aspect_output,
                aspect_conf_output,
                aspect_probs_output,
                sev_output,
                sev_conf_output,
                sev_probs_output,
                mode_output,
                explanation_output
            ]
        )

if __name__ == "__main__":
    demo.launch(server_name="127.0.0.1", server_port=7860, share=False, theme=gr.themes.Soft(), css=custom_css)

