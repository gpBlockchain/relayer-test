import ChaosBladeWrapper from "./chaos-blade-wrapper";
it("demo", async () => {
    const chaosBlade = new ChaosBladeWrapper();
    const experimentUid = await chaosBlade.createExperiment("cpu fulload");
    console.log(`Experiment created with UID: ${experimentUid}`);
  
    const status = await chaosBlade.getStatus(experimentUid);
    console.log(`Experiment status: ${status}`);
    
    await chaosBlade.destroyExperiment(experimentUid);
    console.log("Experiment destroyed.");
})