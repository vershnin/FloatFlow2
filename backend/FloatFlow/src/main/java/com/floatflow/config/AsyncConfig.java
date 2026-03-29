package com.floatflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.core.task.SimpleAsyncTaskExecutor;

import java.util.concurrent.Executor;


@Configuration
public class AsyncConfig implements AsyncConfigurer {
    
    @Bean(name = "taskExecutor")
    @Override
    public Executor getAsyncExecutor() {
        // Use SimpleAsyncTaskExecutor for Java 21+ virtual threads.
        // Virtual threads are cheap, so we don't need (and shouldn't use) pooling here.
        SimpleAsyncTaskExecutor executor = new SimpleAsyncTaskExecutor("floatflow-vt-");
        executor.setVirtualThreads(true);
        executor.setConcurrencyLimit(-1); // No limit since virtual threads handle scale well
        return executor;
    }
}
