function waitAndPrint(message, ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(message);
      resolve();
    }, ms);
  });
}

async function runAsyncFlow() {
  await waitAndPrint("Message 1: Đã chạy sau 1s", 1000);
  await waitAndPrint("Message 2: Đã chạy sau 2s tiếp theo", 2000);
  await waitAndPrint("Message 3: Hoàn thành sau 1s nữa", 1000);
}

runAsyncFlow();