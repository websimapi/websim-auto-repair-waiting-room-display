import { createApp } from 'vue';

const app = createApp({
    data() {
        return {
            showControls: true,
            inPresentationMode: false,
            isGenerating: false,
            loadingMessage: "Generating content...",
            shopName: "Auto Care Center",
            autoRotate: true,
            rotationTime: 15,
            currentSlideIndex: 0,
            rotationInterval: null,
            currentTime: "",
            newSlide: {
                type: "tip",
                serviceType: "",
                customPrompt: ""
            },
            slides: []
        };
    },
    computed: {
        currentSlide() {
            return this.slides[this.currentSlideIndex] || {
                title: "No content available",
                content: "Please generate some content first.",
                imageUrl: "#"
            };
        }
    },
    methods: {
        async generateContent() {
            this.isGenerating = true;
            this.loadingMessage = "Generating creative content...";
            
            try {
                // Generate content based on the selected type
                let prompt = "";
                let title = "";
                
                switch(this.newSlide.type) {
                    case "tip":
                        title = "Car Maintenance Tip";
                        prompt = "Create a helpful car maintenance tip that car owners should know. Include specific advice and why it's important.";
                        break;
                    case "fact":
                        title = "Automotive Fun Fact";
                        prompt = "Share an interesting and surprising fun fact about cars, automotive history, or the auto industry.";
                        break;
                    case "service":
                        title = `${this.newSlide.serviceType} Service`;
                        prompt = `Create informative content about ${this.newSlide.serviceType} service for cars. Explain what it involves, why it's important, and how often it should be done.`;
                        break;
                    case "custom":
                        title = "Custom Information";
                        prompt = this.newSlide.customPrompt;
                        break;
                }
                
                // Generate text content using LLM
                const textCompletion = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are an automotive expert providing concise, informative content for a waiting room display. Keep responses under 200 words and focus on being helpful and educational."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                });
                
                const content = textCompletion.content;
                
                // Generate a dynamic title if it's a custom slide
                if (this.newSlide.type === "custom") {
                    const titleCompletion = await websim.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: "Create a short, catchy title (5 words or less) for the following automotive content."
                            },
                            {
                                role: "user",
                                content: content
                            }
                        ]
                    });
                    
                    title = titleCompletion.content.replace(/"/g, '').trim();
                }
                
                this.loadingMessage = "Generating image...";
                
                // Generate image based on the content
                const imageResult = await websim.imageGen({
                    prompt: `Professional, clean graphic for an auto repair waiting room display about: ${title}. The image should be simple, colorful, and suitable for a professional automotive business display.`,
                    aspect_ratio: "16:9"
                });
                
                // Add the new slide to our collection
                this.slides.push({
                    title: title,
                    content: content,
                    imageUrl: imageResult.url,
                    type: this.newSlide.type
                });
                
                // Reset form
                this.newSlide = {
                    type: "tip",
                    serviceType: "",
                    customPrompt: ""
                };
                
                // If we're in presentation mode and this is the first slide, update display
                if (this.inPresentationMode && this.slides.length === 1) {
                    this.currentSlideIndex = 0;
                }
                
            } catch (error) {
                console.error("Error generating content:", error);
                alert("There was an error generating content. Please try again.");
            } finally {
                this.isGenerating = false;
            }
        },
        
        removeSlide(index) {
            this.slides.splice(index, 1);
            
            // Adjust current slide index if needed
            if (this.currentSlideIndex >= this.slides.length) {
                this.currentSlideIndex = Math.max(0, this.slides.length - 1);
            }
        },
        
        startPresentation() {
            if (this.slides.length === 0) {
                alert("Please generate some content first!");
                return;
            }
            
            this.inPresentationMode = true;
            this.updateClock();
            
            // Clear any existing interval
            if (this.rotationInterval) {
                clearInterval(this.rotationInterval);
            }
            
            // Set up auto-rotation if enabled
            if (this.autoRotate) {
                const interval = this.rotationTime * 1000;
                this.rotationInterval = setInterval(() => {
                    this.nextSlide();
                }, interval);
            }
        },
        
        updateClock() {
            const updateTime = () => {
                const now = new Date();
                this.currentTime = now.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };
            
            updateTime();
            setInterval(updateTime, 1000);
        },
        
        nextSlide() {
            if (this.slides.length > 1) {
                this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slides.length;
            }
        },
        
        previousSlide() {
            if (this.slides.length > 1) {
                this.currentSlideIndex = (this.currentSlideIndex - 1 + this.slides.length) % this.slides.length;
            }
        },
        
        goToSlide(index) {
            this.currentSlideIndex = index;
        },
        
        async generateSampleContent() {
            // Generate 3 sample slides to get started
            this.isGenerating = true;
            this.loadingMessage = "Generating sample content...";
            
            const sampleTypes = [
                { type: "tip", prompt: "Create a helpful car maintenance tip about tire pressure." },
                { type: "fact", prompt: "Share an interesting fun fact about the history of automotive technology." },
                { type: "service", serviceType: "Oil Change", prompt: "Create informative content about oil change service for cars. Explain what it involves, why it's important, and how often it should be done." }
            ];
            
            try {
                for (const sample of sampleTypes) {
                    // Generate text content
                    const textCompletion = await websim.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: "You are an automotive expert providing concise, informative content for a waiting room display. Keep responses under 200 words and focus on being helpful and educational."
                            },
                            {
                                role: "user",
                                content: sample.prompt
                            }
                        ]
                    });
                    
                    const content = textCompletion.content;
                    
                    // Generate title based on type
                    let title = "";
                    switch(sample.type) {
                        case "tip":
                            title = "Tire Pressure Maintenance";
                            break;
                        case "fact":
                            title = "Automotive History Fact";
                            break;
                        case "service":
                            title = `${sample.serviceType} Service`;
                            break;
                    }
                    
                    // Generate image
                    const imageResult = await websim.imageGen({
                        prompt: `Professional, clean graphic for an auto repair waiting room display about: ${title}. The image should be simple, colorful, and suitable for a professional automotive business display.`,
                        aspect_ratio: "16:9"
                    });
                    
                    // Add the slide
                    this.slides.push({
                        title: title,
                        content: content,
                        imageUrl: imageResult.url,
                        type: sample.type
                    });
                }
                
                // Start presentation with the sample content
                this.startPresentation();
                
            } catch (error) {
                console.error("Error generating sample content:", error);
                alert("There was an error generating sample content. Please try again.");
            } finally {
                this.isGenerating = false;
            }
        }
    },
    mounted() {
        // Add keyboard navigation for presentation mode
        document.addEventListener('keydown', (e) => {
            if (this.inPresentationMode) {
                if (e.key === 'ArrowRight') {
                    this.nextSlide();
                } else if (e.key === 'ArrowLeft') {
                    this.previousSlide();
                } else if (e.key === 'Escape') {
                    this.showControls = true;
                }
            }
        });
    },
    beforeUnmount() {
        // Clean up interval when component is destroyed
        if (this.rotationInterval) {
            clearInterval(this.rotationInterval);
        }
    }
});

app.mount('#app');

